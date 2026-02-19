const Attempt = require("../models/Attempt");
const Exam = require("../models/Exam");
const mongoose = require("mongoose");
const Student = require("../models/Student");

exports.getExamReview = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findById(attemptId)
      .populate("exam");

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    // Security: only owner can review
    if (String(attempt.student) !== String(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const exam = attempt.exam;

    const review = exam.questions.map((q, index) => {
      const studentAnswer = attempt.answers[index];
      const correct = q.correct;

      return {
        question: q.text,
        options: q.options,
        studentAnswer: studentAnswer || null,
        correctAnswer: correct,
        isCorrect: studentAnswer === correct
      };
    });

    res.json({
      title: exam.title,
      score: attempt.score,
      total: attempt.total,
      review
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load review" });
  }
};

exports.submitStudentReview = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const student = await Student.findOne({ user_id: req.user.id }).select("_id");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const doc = {
      studentId: student._id,
      message,
      timestamp: new Date()
    };

    const result = await mongoose.connection.collection("student_reviews").insertOne(doc);
    return res.status(201).json({
      message: "Review request submitted",
      reviewId: result.insertedId
    });
  } catch (err) {
    console.error("Submit student review error:", err);
    return res.status(500).json({ message: "Failed to submit review" });
  }
};
