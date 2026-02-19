const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");

const examController = require("../controllers/examController");

// List published exams
router.get(
  "/",
  authStudent,
  checkStudentProfileComplete,
  examController.getAvailableExams
);

// Get exam questions
router.get(
  "/:id",
  authStudent,
  checkStudentProfileComplete,
  examController.getExamById
);

const freeOrPaidGuard = require("../middleware/freeOrPaidGuard");

router.get(
  "/:id",
  authStudent,
  checkStudentProfileComplete,
  freeOrPaidGuard,
  examController.getExamById
);


module.exports = router;
