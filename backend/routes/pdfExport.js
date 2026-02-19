const express = require("express");

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const {
  verifyPdfPayment,
  exportLearningPdf
} = require("../controllers/pdfExport.controller");

const router = express.Router();

router.post("/verify-payment", authStudent, checkStudentProfileComplete, verifyPdfPayment);
router.post("/download", authStudent, checkStudentProfileComplete, exportLearningPdf);

module.exports = router;
