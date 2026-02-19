const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const Student = require("../models/Student");
const StudentCourse = require("../models/StudentCourse");
const LiveClass = require("../models/LiveClass");

// GET /student/live-classes
router.get("/live-classes", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const links = await StudentCourse.find({ student_id: student._id }).select("course_id");
    const courseIds = links.map(l => l.course_id);

    if (!courseIds.length) {
      return res.json([]);
    }

    const classes = await LiveClass.find({ course_id: { $in: courseIds } })
      .sort({ date: 1 });

    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch live classes" });
  }
});

module.exports = router;
