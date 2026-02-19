const QuestionBank = require("../models/QuestionBank");
const CBTExam = require("../models/CBTExam");

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

function sanitizeQuestion(input) {
  const type = String(input?.type || "mcq").trim().toLowerCase() === "fill" ? "fill" : "mcq";
  const text = String(input?.text || "").trim();
  const options = Array.isArray(input?.options)
    ? input.options.map((opt) => String(opt || "").trim()).filter(Boolean)
    : [];
  const rawAnswer = String(input?.correctAnswer || "").trim();
  const correctAnswer = type === "mcq" ? rawAnswer.toUpperCase() : rawAnswer;
  return { type, text, options, correctAnswer };
}

exports.addQuestionToBank = async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.body?.courseCode);
    const question = sanitizeQuestion(req.body);

    if (!courseCode || !question.text || !question.correctAnswer) {
      return res.status(400).json({ message: "courseCode, text and correctAnswer are required" });
    }

    if (question.type === "mcq") {
      if (question.options.length < 2) {
        return res.status(400).json({ message: "MCQ requires options" });
      }
      if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
        return res.status(400).json({ message: "MCQ correctAnswer must be A, B, C or D" });
      }
    }

    const bank = await QuestionBank.findOneAndUpdate(
      { courseCode },
      { $push: { questions: question } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      courseCode: bank.courseCode,
      totalQuestions: Array.isArray(bank.questions) ? bank.questions.length : 0
    });
  } catch (err) {
    console.error("addQuestionToBank error:", err);
    return res.status(500).json({ message: "Failed to add question to bank" });
  }
};

exports.generateMockExam = async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.body?.courseCode);
    const duration = Number(req.body?.duration) || 50;
    if (!courseCode) {
      return res.status(400).json({ message: "courseCode is required" });
    }

    const bank = await QuestionBank.findOne({ courseCode }).lean();
    const pool = Array.isArray(bank?.questions) ? [...bank.questions] : [];
    if (!pool.length) {
      return res.status(404).json({ message: "Question bank is empty for this course" });
    }

    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selected = pool.slice(0, 100);

    const exam = await CBTExam.findOneAndUpdate(
      { courseCode },
      {
        courseCode,
        duration,
        questions: selected.map((q) => ({
          type: q.type === "fill" ? "fill" : "mcq",
          text: q.text,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correctAnswer
        }))
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      courseCode: exam.courseCode,
      duration: exam.duration,
      totalQuestions: Array.isArray(exam.questions) ? exam.questions.length : 0
    });
  } catch (err) {
    console.error("generateMockExam error:", err);
    return res.status(500).json({ message: "Failed to generate mock exam" });
  }
};

exports.deleteQuestionFromBank = async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.body?.courseCode);
    const target = sanitizeQuestion(req.body);

    if (!courseCode || !target.text) {
      return res.status(400).json({ message: "courseCode and text are required" });
    }

    const bank = await QuestionBank.findOne({ courseCode });
    if (!bank) {
      return res.status(404).json({ message: "Question bank not found for course" });
    }

    const questions = Array.isArray(bank.questions) ? bank.questions : [];
    const matchIndex = questions.findIndex((q) => {
      const sameType = String(q.type || "mcq") === target.type;
      const sameText = String(q.text || "").trim() === target.text;
      const sameAnswer = String(q.correctAnswer || "").trim() === target.correctAnswer;
      const sameOptions =
        target.type === "fill" ||
        JSON.stringify(Array.isArray(q.options) ? q.options : []) === JSON.stringify(target.options);
      return sameType && sameText && sameAnswer && sameOptions;
    });

    if (matchIndex === -1) {
      return res.status(404).json({ message: "Question not found in bank" });
    }

    questions.splice(matchIndex, 1);
    bank.questions = questions;
    await bank.save();

    return res.json({
      success: true,
      courseCode: bank.courseCode,
      totalQuestions: bank.questions.length
    });
  } catch (err) {
    console.error("deleteQuestionFromBank error:", err);
    return res.status(500).json({ message: "Failed to delete question from bank" });
  }
};
