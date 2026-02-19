const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const {
  getMyMaterials,
  getMyMocks,
  getMyTimetables
} = require("../controllers/studentAcademicMe.controller");

router.get("/materials/me", authStudent, checkStudentProfileComplete, getMyMaterials);
router.get("/mocks/me", authStudent, checkStudentProfileComplete, getMyMocks);
router.get("/timetables/me", authStudent, checkStudentProfileComplete, getMyTimetables);

module.exports = router;
