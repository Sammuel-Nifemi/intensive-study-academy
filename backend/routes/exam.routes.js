const express = require("express");
const router = express.Router();

const {
  startExam,
  submitExam
} = require("../controllers/exam.controller");

const authStudent = require("../middleware/authStudent");

router.post("/start/:examId", authStudent, startExam);
router.post("/submit", authStudent, submitExam);

module.exports = router;
