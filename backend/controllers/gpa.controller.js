const ExamResult = require("../models/ExamResult");
const Exam = require("../models/Exam");
const Course = require("../models/Course");
const Student = require("../models/Student");const getGrade = require("../config/gradeMap");

/* =========================
   GET GPA / CGPA
========================= */
exports.getGPA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!user.student) {
      return res.status(400).json({
        message: "Student profile incomplete"
      });
    }

    if (!user.student.hasPaid) {
      return res.status(403).json({
        message: "Please complete payment to view GPA"
      });
    }

    const results = await ExamResult.find({
      student: user._id
    }).populate({
      path: "exam",
      populate: { path: "course" }
    });

    let totalUnits = 0;
    let totalWeightedPoints = 0;

    const breakdown = results.map(result => {
      const percent =
        (result.score / result.totalQuestions) * 100;

      const { grade, point } = getGrade(percent);
      const unit = result.exam.course.unit;

      totalUnits += unit;
      totalWeightedPoints += unit * point;

      return {
        course: result.exam.course.title,
        unit,
        score: percent,
        grade,
        gradePoint: point
      };
    });

    const cgpa =
      totalUnits === 0
        ? 0
        : (totalWeightedPoints / totalUnits).toFixed(2);

    res.json({
      totalUnits,
      cgpa,
      breakdown
    });
  } catch (err) {
    console.error("GPA error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   VIEW PAST RESULTS
========================= */
exports.getMyResults = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!user.student) {
      return res.status(400).json({
        message: "Student profile incomplete"
      });
    }

    if (!user.student.hasPaid) {
      return res.status(403).json({
        message: "Please complete payment to view results"
      });
    }

    const results = await ExamResult.find({
      student: user._id
    })
      .populate({
        path: "exam",
        populate: { path: "course" }
      })
      .sort({ createdAt: -1 });

    res.json({
      total: results.length,
      results
    });
  } catch (err) {
    console.error("Results fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
