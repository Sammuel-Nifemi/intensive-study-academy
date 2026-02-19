const express = require("express");
const router = express.Router();

const { downloadResultsPDF } = require("../controllers/pdf.controller");
const authStudent = require("../middleware/authStudent");

router.get("/results/pdf", authStudent, downloadResultsPDF);

module.exports = router;
