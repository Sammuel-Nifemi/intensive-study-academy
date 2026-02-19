const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const { getMyFees, analyzeFees } = require("../controllers/fees.controller");

router.get("/analyze", analyzeFees);
router.get("/me", authStudent, checkStudentProfileComplete, getMyFees);

module.exports = router;
