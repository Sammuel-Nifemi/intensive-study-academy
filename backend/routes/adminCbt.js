const express = require("express");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const router = express.Router();

const authRoles = require("../middleware/authRoles");
const createPdfUploader = require("../utils/uploadPdf");
const { createCBTExam } = require("../controllers/cbtExam.controller");
const {
  addQuestionToBank,
  generateMockExam,
  deleteQuestionFromBank,
  generateQuestionsWithAi
} = require("../controllers/questionBank.controller");

const CBTQuestion = require("../models/CBTQuestion");
const CBTExam = require("../models/CBTExam");
const Staff = require("../models/Staff");

const uploadCbt = createPdfUploader("cbt");

async function canManageCbt(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Access denied." });
    }

    const staff = await Staff.findById(req.user.id).select("permissions");
    if (!staff) {
      return res.status(403).json({ message: "Staff not found" });
    }

    if (!Array.isArray(staff.permissions) || !staff.permissions.includes("cbt")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ message: "Permission check failed" });
  }
}

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

function parseQuestions(rawText) {
  const text = String(rawText || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  if (!text) return [];

  const matches = [...text.matchAll(/(^|\n)\s*(\d+)\s*[).]\s+/g)];
  if (matches.length === 0) {
    return [];
  }

  const blocks = matches.map((match, idx) => {
    const start = match.index + match[0].length;
    const end = idx + 1 < matches.length ? matches[idx + 1].index : text.length;
    return text.slice(start, end).trim();
  });

  return blocks
    .map((block, idx) => {
      if (!block) return null;

      let answer = "";
      const answerMatch = block.match(/Answer\s*:\s*(.+)$/im);
      if (answerMatch) {
        answer = answerMatch[1].trim();
        block = block.replace(answerMatch[0], "").trim();
      }

      const optionMatches = [...block.matchAll(/(^|\n)\s*([A-D])[\).]\s+(.+)/g)];
      let options = [];
      if (optionMatches.length >= 2) {
        options = optionMatches.map((m) => m[3].trim());
      }

      let questionText = block;
      if (optionMatches.length) {
        const firstOptIndex = optionMatches[0].index ?? block.length;
        questionText = block.slice(0, firstOptIndex).trim();
      }

      const questionType =
        options.length >= 2 ? "mcq" : "fill";

      let correctAnswer = answer;
      if (questionType === "mcq") {
        const letterMatch = answer.match(/^[A-D]$/i);
        if (letterMatch) {
          correctAnswer = letterMatch[0].toUpperCase();
        } else if (answer) {
          // Try to map text answer to option letter
          const optionIndex = options.findIndex(
            (opt) => opt.toLowerCase() === answer.toLowerCase()
          );
          if (optionIndex >= 0) {
            correctAnswer = String.fromCharCode(65 + optionIndex);
          }
        }
      }

      return {
        questionText: questionText || `Question ${idx + 1}`,
        questionType,
        options,
        correctAnswer,
        order: idx + 1
      };
    })
    .filter(Boolean);
}

router.post("/cbt", authRoles(["admin", "staff"]), canManageCbt, createCBTExam);
router.post("/question-bank", authRoles(["admin", "staff"]), canManageCbt, addQuestionToBank);
router.post(
  "/question-bank/generate-ai",
  authRoles(["admin", "staff"]),
  canManageCbt,
  generateQuestionsWithAi
);
router.delete("/question-bank", authRoles(["admin", "staff"]), canManageCbt, deleteQuestionFromBank);
router.post("/generate-mock", authRoles(["admin", "staff"]), canManageCbt, generateMockExam);

router.post(
  "/cbt/convert",
  authRoles(["admin", "staff"]),
  canManageCbt,
  uploadCbt.single("file"),
  async (req, res) => {
    try {
      const courseCode = normalizeCourseCode(req.body.courseCode);
      if (!courseCode) {
        return res.status(400).json({ message: "courseCode is required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "PDF file is required" });
      }

      const pdfBuffer = fs.readFileSync(req.file.path);
      const parsed = await pdfParse(pdfBuffer);
      const questions = parseQuestions(parsed.text);

      if (!questions.length) {
        return res.status(400).json({ message: "No questions detected in PDF" });
      }

      await CBTQuestion.deleteMany({ courseCode });
      const docs = questions.map((q) => ({
        courseCode,
        ...q
      }));
      await CBTQuestion.insertMany(docs);

      const durationMinutes = Number(req.body.durationMinutes) || 50;
      const totalQuestions = questions.length;

      await CBTExam.findOneAndUpdate(
        { courseCode },
        {
          courseCode,
          duration: durationMinutes,
          questions: questions.map((q) => ({
            text: q.questionText,
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer
          }))
        },
        { new: true, upsert: true }
      );

      res.status(201).json({
        courseCode,
        totalQuestions,
        durationMinutes
      });
    } catch (err) {
      console.error("CBT convert error:", err);
      res.status(500).json({ message: "Failed to convert CBT exam" });
    }
  }
);

module.exports = router;
