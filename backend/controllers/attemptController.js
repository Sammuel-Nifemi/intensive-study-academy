

const Attempt = require("../models/Attempt");
const Exam = require("../models/Exam");

exports.submitAttempt = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const studentId = req.user.id;

    if (!examId || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const exam = await Exam.findById(examId);
    if (!exam || exam.status !== "published") {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Optional: prevent reattempts
    // const exists = await Attempt.findOne({ student: studentId, exam: examId });
    // if (exists) return res.status(403).json({ message: "Already attempted" });

    let score = 0;
    exam.questions.forEach((q, i) => {
      if (answers[i] && answers[i] === q.correct) score++;
    });

    const attempt = await Attempt.create({
      student: studentId,
      exam: examId,
      answers,
      score,
      total: exam.questions.length
    });

    res.json({
      message: "Submitted",
      score,
      total: exam.questions.length,
      attemptId: attempt._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Submission failed" });
  }
};
