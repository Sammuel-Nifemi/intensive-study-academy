const CBTExam = require("../models/CBTExam");

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

function sanitizeQuestion(question) {
  const text = String(question?.text || "").trim();
  const options = Array.isArray(question?.options)
    ? question.options.map((o) => String(o || "").trim()).filter(Boolean)
    : [];
  const correctAnswer = String(question?.correctAnswer || "").trim();
  return { text, options, correctAnswer };
}

exports.createCBTExam = async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.body?.courseCode);
    const duration = Number(req.body?.duration);
    const inputQuestions = Array.isArray(req.body?.questions) ? req.body.questions : [];
    const questions = inputQuestions.map(sanitizeQuestion).filter((q) => q.text && q.options.length && q.correctAnswer);

    if (!courseCode || !Number.isFinite(duration) || duration <= 0 || !questions.length) {
      return res.status(400).json({ message: "courseCode, duration and questions are required" });
    }

    const exam = await CBTExam.findOneAndUpdate(
      { courseCode },
      { courseCode, duration, questions },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, exam });
  } catch (err) {
    console.error("createCBTExam error:", err);
    return res.status(500).json({ message: "Failed to save CBT exam" });
  }
};

exports.getCBTExam = async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.params.courseCode);
    if (!courseCode) {
      return res.status(400).json({ message: "courseCode is required" });
    }

    const exam = await CBTExam.findOne({ courseCode }).lean();
    if (!exam) {
      return res.status(404).json({ message: "CBT exam not found" });
    }

    return res.json(exam);
  } catch (err) {
    console.error("getCBTExam error:", err);
    return res.status(500).json({ message: "Failed to load CBT exam" });
  }
};

