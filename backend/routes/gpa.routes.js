const express = require("express");
const router = express.Router();

const {
  getGPA,
  getMyResults
} = require("../controllers/gpa.controller");
const authStudent = require("../middleware/authStudent");

router.get("/gpa", authStudent, getGPA);
router.get("/results", authStudent, getMyResults);


module.exports = router;
