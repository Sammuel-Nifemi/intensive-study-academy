const express = require("express");
const router = express.Router();

const authAdmin = require("../middleware/authAdmin");
const ProgramCourse = require("../models/ProgramCourse");
const Program = require("../models/Program");
const AdminCourse = require("../models/AdminCourse");

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

// POST /api/admin/program-courses
router.post("/program-courses", authAdmin, async (req, res) => {
  try {
    const { program, level, semester, courseCode, category } = req.body || {};

    const resolvedProgram = program;
    const resolvedLevel = String(level || "").trim();
    const resolvedSemester = String(semester || "").trim();
    const resolvedCourseCode = normalizeCourseCode(courseCode);
    const resolvedCategory = String(category || "").trim().toLowerCase();

    if (
      !resolvedProgram ||
      !resolvedLevel ||
      !resolvedSemester ||
      !resolvedCourseCode ||
      !resolvedCategory
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["compulsory", "elective"].includes(resolvedCategory)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const programDoc = await Program.findById(resolvedProgram).select("_id name");
    if (!programDoc) {
      return res.status(400).json({ message: "Program not found" });
    }

    const course = await AdminCourse.findOne({
      courseCode: new RegExp(`^${resolvedCourseCode}$`, "i")
    }).select("courseCode title units");
    if (!course) {
      return res.status(400).json({ message: "Course not found" });
    }

    const record = await ProgramCourse.create({
      program: programDoc._id,
      level: resolvedLevel,
      semester: resolvedSemester,
      courseCode: resolvedCourseCode,
      category: resolvedCategory
    });

    res.status(201).json(record);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Program course already exists" });
    }
    res.status(500).json({ message: "Failed to create program course" });
  }
});

// GET /api/admin/program-courses
router.get("/program-courses", authAdmin, async (req, res) => {
  try {
    const items = await ProgramCourse.find()
      .populate({ path: "program", select: "name" })
      .sort({ createdAt: -1 })
      .lean();

    const codes = items.map((i) => i.courseCode).filter(Boolean);
    const courses = await AdminCourse.find({
      courseCode: { $in: codes }
    })
      .select("courseCode title units")
      .lean();
    const courseMap = new Map(courses.map((c) => [String(c.courseCode), c]));

    const payload = items.map((item) => ({
      ...item,
      course: courseMap.get(String(item.courseCode)) || null
    }));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to load program courses" });
  }
});

// DELETE /api/admin/program-courses/:id
router.delete("/program-courses/:id", authAdmin, async (req, res) => {
  try {
    const deleted = await ProgramCourse.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Program course not found" });
    }
    res.json({ message: "Program course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete program course" });
  }
});

module.exports = router;
