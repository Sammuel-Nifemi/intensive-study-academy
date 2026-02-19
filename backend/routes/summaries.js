const express = require("express");
const PDFDocument = require("pdfkit");

const Summary = require("../models/Summary");

const router = express.Router();

// GET /api/summaries?course=<courseCode>
router.get("/", async (req, res) => {
  try {
    const courseCode = String(req.query.course || "").trim();
    if (!courseCode) {
      return res.status(400).json({ message: "course query is required" });
    }

    const summary = await Summary.findOne({
      courseCode: new RegExp(`^${courseCode}$`, "i")
    }).lean();

    if (!summary) {
      return res.status(404).json({ message: "Summary not found" });
    }

    res.json({
      courseCode: summary.courseCode,
      content: summary.content
    });
  } catch (err) {
    console.error("Summary fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/summaries/pdf?course=<courseCode>
router.get("/pdf", async (req, res) => {
  try {
    const courseCode = String(req.query.course || "").trim();
    if (!courseCode) {
      return res.status(400).json({ message: "course query is required" });
    }

    const summary = await Summary.findOne({
      courseCode: new RegExp(`^${courseCode}$`, "i")
    }).lean();

    if (!summary) {
      return res.status(404).json({ message: "Summary not found" });
    }

    const filename = `${summary.courseCode}-summary.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text(`${summary.courseCode} Summary`, { align: "left" });
    doc.moveDown();
    doc.fontSize(12).text(summary.content, {
      align: "left"
    });

    doc.end();
  } catch (err) {
    console.error("Summary PDF error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
