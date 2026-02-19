const express = require("express");
const router = express.Router();
const Semester = require("../models/Semester");

// Get active semesters
router.get("/active", async (req, res) => {
  try {
    const semesters = await Semester.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(semesters);
  } catch (err) {
    res.status(500).json({ message: "Failed to load semesters" });
  }
});

module.exports = router;
