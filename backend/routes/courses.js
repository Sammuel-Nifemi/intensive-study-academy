const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const Student = require("../models/Student");
const Program = require("../models/Program");
const ProgramCourse = require("../models/ProgramCourse");
const AdminCourse = require("../models/AdminCourse");

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /courses
// Returns full course list. No program/level/curriculum filtering.
router.get("/", async (req, res) => {
  try {
    const items = await AdminCourse.find()
      .select("_id courseCode title")
      .sort({ courseCode: 1 })
      .lean();

    const payload = items.map((item) => ({
      _id: item._id,
      courseCode: item.courseCode,
      title: item.title
    }));

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// GET /courses/available
router.get("/available", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let programId = student.programId || null;
    if (!programId && student.program) {
      const program = await Program.findOne({ name: student.program }).select("_id");
      if (program?._id) programId = program._id;
    }

    if (!programId || !student.level || !student.semester) {
      return res.status(400).json({ message: "Student profile incomplete" });
    }

    const mappings = await ProgramCourse.find({
      program: programId,
      level: String(student.level).trim(),
      semester: String(student.semester).trim()
    })
      .select("_id program level semester courseCode category")
      .lean();

    if (!mappings.length) {
      return res.json([]);
    }

    const codes = mappings.map((m) => m.courseCode).filter(Boolean);
    const courses = await AdminCourse.find({
      courseCode: { $in: codes }
    })
      .select("courseCode title units level semester")
      .lean();
    const courseMap = new Map(courses.map((c) => [String(c.courseCode), c]));

    const payload = mappings
      .map((m) => {
        const course = courseMap.get(String(m.courseCode));
        if (!course) return null;
        return {
          _id: m._id,
          courseCode: m.courseCode,
          title: course.title,
          category: m.category,
          program: m.program,
          level: m.level,
          semester: m.semester
        };
      })
      .filter(Boolean);

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// GET /courses/search?q=...
router.get("/search", authStudent, async (req, res) => {
  try {
    const q = String(req.query?.q || "").trim();
    if (q.length < 2) {
      return res.json([]);
    }

    const pattern = escapeRegex(q);
    const items = await AdminCourse.find({
      $or: [
        { courseCode: { $regex: pattern, $options: "i" } },
        { title: { $regex: pattern, $options: "i" } }
      ]
    })
      .select("_id courseCode title")
      .sort({ courseCode: 1 })
      .limit(30)
      .lean();

    const payload = items.map((item) => ({
      _id: item._id,
      courseCode: item.courseCode,
      title: item.title
    }));

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to search courses" });
  }
});

module.exports = router;
