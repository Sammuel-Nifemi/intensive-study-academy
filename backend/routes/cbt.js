const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const { getCBTExam } = require("../controllers/cbtExam.controller");
const CBTExam = require("../models/CBTExam");
const CBTAttempt = require("../models/CBTAttempt");
const { submitMockAttempt } = require("../controllers/mockSubmission.controller");

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeAnswer(value) {
  return String(value || "").trim().toUpperCase();
}

router.get("/latest/:courseCode", authStudent, getCBTExam);
router.get("/:courseCode", authStudent, getCBTExam);

router.get("/:courseCode/exam", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.params.courseCode);
    const exam = await CBTExam.findOne({ courseCode });
    if (!exam) {
      return res.status(404).json({ message: "Exam not available" });
    }

    res.json({
      courseCode: exam.courseCode,
      durationMinutes: exam.duration,
      totalQuestions: Array.isArray(exam.questions) ? exam.questions.length : 0
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load exam" });
  }
});

router.get("/:courseCode/questions", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.params.courseCode);
    const exam = await CBTExam.findOne({ courseCode }).lean();
    if (!exam) {
      return res.status(404).json({ message: "Exam not available" });
    }

    const shuffled = (Array.isArray(exam.questions) ? exam.questions : []).map((q, idx) => ({
      _id: String(idx),
      questionText: q.text,
      questionType: q.type === "fill" ? "fill" : "mcq",
      options: Array.isArray(q.options) ? q.options : []
    }));

    res.json(shuffled);
  } catch (err) {
    res.status(500).json({ message: "Failed to load questions" });
  }
});

router.post("/:courseCode/submit", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.params.courseCode);
    const { answers, durationUsed } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Answers are required" });
    }

    const exam = await CBTExam.findOne({ courseCode }).lean();
    const questions = Array.isArray(exam?.questions) ? exam.questions : [];
    if (!questions.length) {
      return res.status(400).json({ message: "Questions not found for submission" });
    }

    let score = 0;
    answers.forEach((item) => {
      const qIndex = Number(item.questionId);
      const q = Number.isInteger(qIndex) ? questions[qIndex] : null;
      if (!q) return;

      const questionType = q.type === "fill" ? "fill" : "mcq";
      if (questionType === "fill") {
        const studentAnswer = String(item.answer || "").trim().toLowerCase();
        const correct = String(q.correctAnswer || "").trim().toLowerCase();
        if (studentAnswer && correct && studentAnswer === correct) {
          score += 1;
        }
      } else {
        const studentAnswer = normalizeAnswer(item.answer);
        const correct = normalizeAnswer(q.correctAnswer || "");
        if (studentAnswer && studentAnswer === correct) {
          score += 1;
        }
      }
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
    const studentId = req.student?._id || req.user.id;

    await CBTAttempt.create({
      studentId,
      courseCode,
      score,
      totalQuestions,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer
      })),
      submittedAt: new Date(),
      durationUsed: Number(durationUsed) || 0
    });

    res.json({ score, totalQuestions, percentage });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit CBT" });
  }
});

router.post("/submit", authStudent, checkStudentProfileComplete, submitMockAttempt);

router.get("/me/history", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const studentId = req.student?._id || req.user.id;
    const attempts = await CBTAttempt.find({ studentId })
      .sort({ submittedAt: -1, createdAt: -1 });

    const grouped = {};
    attempts.forEach((attempt) => {
      const code = attempt.courseCode;
      if (!grouped[code]) grouped[code] = [];
      grouped[code].push({
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.totalQuestions
          ? Math.round((attempt.score / attempt.totalQuestions) * 100)
          : 0,
        submittedAt: attempt.submittedAt,
        durationUsed: attempt.durationUsed
      });
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: "Failed to load CBT history" });
  }
});

module.exports = router;
