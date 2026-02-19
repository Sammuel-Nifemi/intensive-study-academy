const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const {
  getPastQuestionsByCourse
} = require("../controllers/pastQuestionController");

router.get(
  "/:courseCode",
  authStudent,
  checkStudentProfileComplete,
  getPastQuestionsByCourse
);

module.exports = router;
