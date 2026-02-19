const express = require("express");
const router = express.Router();
require("../models/Faculty");

const Program = require("../models/Program");
const StudyCenter = require("../models/StudyCenter");

// =====================
// GET ALL PROGRAMS
// =====================
router.get("/programs", async (req, res) => {
  try {
    const programs = await Program.find().populate({
      path: "facultyId",
      select: "name"
    });

    const formatted = programs.map((p) => ({
      _id: p._id,
      name: p.name,
      facultyId: p.facultyId?._id || p.facultyId || null,
      facultyName: p.facultyId?.name || ""
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Failed to load programs", err);
    res.status(500).json({ message: "Server error loading programs" });
  }
});


module.exports = router;
