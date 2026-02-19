const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const paymentController = require("../controllers/paymentController");

router.post(
  "/unlock",
  authStudent,
  checkStudentProfileComplete,
  paymentController.unlockSemesterAccess
);

module.exports = router;
