const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const {
  saveStudentCourses,
  getStudentCourses
} = require("../controllers/studentCourses.controller");

router.post("/courses", authStudent, checkStudentProfileComplete, saveStudentCourses);
router.get("/courses", authStudent, checkStudentProfileComplete, getStudentCourses);

module.exports = router;
