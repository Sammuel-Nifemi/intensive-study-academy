
const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const attemptController = require("../controllers/attemptController");

router.post(
  "/submit",
  authStudent,
  checkStudentProfileComplete,
  attemptController.submitAttempt
);

module.exports = router;
