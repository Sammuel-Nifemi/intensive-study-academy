const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const Announcement = require("../models/Announcement");

/* =========================
   STUDENT ANNOUNCEMENTS
========================= */
router.get("/", authStudent, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

module.exports = router;
