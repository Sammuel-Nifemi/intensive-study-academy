const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const reviewController = require("../controllers/reviewController");

router.get(
  "/:attemptId",
  authStudent,
  checkStudentProfileComplete,
  reviewController.getExamReview
);

module.exports = router;
