const express = require("express");
const router = express.Router();

const { getStudentCalendar } = require("../controllers/calendar.controller");
const authStudent = require("../middleware/authStudent");

router.get("/calendar", authStudent, getStudentCalendar);

module.exports = router;
