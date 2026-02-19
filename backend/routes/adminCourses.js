const express = require("express");
const router = express.Router();

const authAdmin = require("../middleware/authAdmin");
const AdminCourse = require("../models/AdminCourse");

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

// Public: get all courses (no auth)
router.get("/public/courses", async (req, res) => {
  try {
    const courses = await AdminCourse.find().sort({ courseCode: 1 }).lean();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

router.get("/courses/check", authAdmin, async (req, res) => {
  try {
    const code = normalizeCourseCode(req.query.code);
    if (!code) {
      return res.json({ exists: false });
    }
    const existing = await AdminCourse.findOne({
      courseCode: new RegExp(`^${code}$`, "i")
    }).select("_id");
    res.json({ exists: Boolean(existing) });
  } catch (err) {
    res.status(500).json({ message: "Failed to check course code" });
  }
});

router.post("/courses", authAdmin, async (req, res) => {
  try {
    const {
      courseCode,
      code,
      title,
      name,
      level,
      semester,
      units
    } = req.body;

    const resolvedCode = normalizeCourseCode(courseCode || code);
    const resolvedTitle = String(title || name || "").trim();
    if (
      !resolvedCode ||
      !resolvedTitle ||
      !level ||
      !semester ||
      !units
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedUnits = Number(units);
    if (![2, 3].includes(parsedUnits)) {
      return res.status(400).json({ message: "Units must be 2 or 3" });
    }

    const existing = await AdminCourse.findOne({
      courseCode: new RegExp(`^${resolvedCode}$`, "i")
    });
    if (existing) {
      return res.status(409).json({ message: "Course code already exists" });
    }

    const course = await AdminCourse.create({
      courseCode: resolvedCode,
      title: resolvedTitle,
      level: String(level).trim(),
      semester: String(semester).trim(),
      units: parsedUnits
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: "Failed to create course" });
  }
});

router.get("/courses", authAdmin, async (req, res) => {
  try {
    const courses = await AdminCourse.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

router.delete("/courses/:id", authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AdminCourse.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course" });
  }
});

module.exports = router;
