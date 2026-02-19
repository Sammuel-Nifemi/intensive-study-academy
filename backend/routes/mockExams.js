const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const {
  getMockExam,
  submitMockExam
} = require("../controllers/mockExam.controller");

router.get("/:course", authStudent, getMockExam);
router.post(
  "/submit",
  authStudent,
  submitMockExam
);

module.exports = router;
