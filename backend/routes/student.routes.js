const express = require("express");
const router = express.Router();

const { loginStudent } = require("../controllers/studentAuth.controller");
const { getStudentDashboard } = require("../controllers/studentDashboard.controller");

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");

// LOGIN
router.post("/login", loginStudent);

// DASHBOARD
router.get("/dashboard", authStudent, checkStudentProfileComplete, getStudentDashboard);

module.exports = router;
