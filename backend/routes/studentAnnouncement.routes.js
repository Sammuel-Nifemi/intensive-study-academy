const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const { getStudentAnnouncements } = require("../controllers/studentAnnouncement.controller");

/* =========================
   STUDENT ANNOUNCEMENTS
========================= */

router.get("/announcements", authStudent, getStudentAnnouncements);

module.exports = router;
