const PDFDocument = require("pdfkit");
const ExamResult = require("../models/ExamResult");
const Student = require("../models/Student");
exports.downloadResultsPDF = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!user.student || !user.student.hasPaid) {
      return res.status(403).json({
        message: "Payment required to download results"
      });
    }

    const results = await ExamResult.find({
      student: user._id
    })
      .populate({
        path: "exam",
        populate: { path: "course" }
      })
      .sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=results.pdf"
    );

    doc.pipe(res);

    // ===== HEADER =====
    doc
      .fontSize(18)
      .text("Intensive Study Academy", { align: "center" })
      .moveDown();

    doc
      .fontSize(14)
      .text("Student Results Report", { align: "center" })
      .moveDown(2);

    doc.fontSize(11).text(`Student: ${user.email}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // ===== RESULTS =====
    results.forEach((r, index) => {
      const percent =
        (r.score / r.totalQuestions) * 100;

      doc
        .fontSize(11)
        .text(
          `${index + 1}. ${r.exam.course.title} — ${percent.toFixed(
            1
          )}%`
        );
    });

    doc.end();
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
