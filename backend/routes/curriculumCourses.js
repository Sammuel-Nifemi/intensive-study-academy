const express = require("express");
const router = express.Router();

const CurriculumCourse = require("../models/CurriculumCourse");

// GET /api/curriculum/courses
router.get("/courses", async (req, res) => {
  try {
    const { faculty, program, level, semester } = req.query || {};
    const query = {};
    if (faculty) query.faculty = faculty;
    if (program) query.program = program;
    if (level) query.level = Number(level);
    if (semester) query.semester = semester;

    const courses = await CurriculumCourse.find(query)
      .select("code title faculty program level semester units")
      .sort({ code: 1 })
      .lean();

    res.json(Array.isArray(courses) ? courses : []);
  } catch (err) {
    console.error("Failed to load curriculum courses", err);
    res.status(500).json({ message: "Server error loading courses" });
  }
});

module.exports = router;
