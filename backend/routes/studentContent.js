const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const Student = require("../models/Student");
const StudentCourse = require("../models/StudentCourse");
const Content = require("../models/Content");

// GET /student/content
router.get("/content", authStudent, async (req, res) => {
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

    const content = await Content.find({ course_id: { $in: courseIds } })
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch content" });
  }
});

module.exports = router;
