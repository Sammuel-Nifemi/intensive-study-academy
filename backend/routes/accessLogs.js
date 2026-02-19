const express = require("express");
const router = express.Router();

const PaymentLog = require("../models/PaymentLog");

// POST /api/access/log
router.post("/log", async (req, res) => {
  try {
    const {
      studentId,
      student_id,
      resourceId,
      amount,
      reference,
      courseCode,
      course_code,
      platform
    } = req.body || {};

    const resolvedStudent = student_id || studentId;
    const resolvedCourse = course_code || courseCode;

    if (!resolvedStudent || !reference || typeof amount !== "number" || !resolvedCourse || !platform) {
      return res.status(400).json({
        message: "student_id, course_code, platform, amount, and reference are required"
      });
    }

    const log = await PaymentLog.create({
      student_id: resolvedStudent,
      course_code: String(resolvedCourse).toUpperCase(),
      platform: String(platform).trim(),
      amount,
      reference
    });

    res.json({ success: true, id: log._id, resourceId: resourceId || null });
  } catch (err) {
    console.error("Access log error:", err);
    res.status(500).json({ message: "Failed to log access" });
  }
});

module.exports = router;
