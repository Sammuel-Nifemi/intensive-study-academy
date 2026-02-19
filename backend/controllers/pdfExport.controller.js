const PDFDocument = require("pdfkit");
const Payment = require("../models/Payment");
const Student = require("../models/Student");

const BRAND_LINE = "IntensiveStudyAcademy.com • 08127796978 • 07073859837";
const PDF_FEE = 200;

function sanitizeText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function buildWatermarkLine(student) {
  const alias = sanitizeText(student?.studentAlias || "Student");
  const isaStudentId = sanitizeText(student?.isaStudentId || "ISA-00000");
  return `${alias} • ${isaStudentId} • ${BRAND_LINE}`;
}

function buildFooterLine(student) {
  const alias = sanitizeText(student?.studentAlias || "Student");
  const isaStudentId = sanitizeText(student?.isaStudentId || "ISA-00000");
  return `Generated for ${alias} (${isaStudentId}) • ${BRAND_LINE}`;
}

async function resolveStudent(req) {
  if (!req.user?.id) return null;
  return Student.findOne({ user_id: req.user.id }).select("studentAlias isaStudentId");
}

async function hasValidPdfPayment(req, amount = PDF_FEE) {
  const reference = sanitizeText(req.body?.reference);
  if (!reference) return false;

  const payment = await Payment.findOne({
    student: req.user.id,
    reference,
    status: "success",
    amount: { $gte: amount }
  }).select("_id");

  return Boolean(payment);
}

function drawWatermark(doc, watermarkText) {
  const width = doc.page.width;
  const height = doc.page.height;
  doc.save();
  doc.opacity(0.11);
  doc.fillColor("#808080");
  doc.fontSize(11);
  for (let y = 100; y < height; y += 110) {
    for (let x = -120; x < width; x += 280) {
      doc.rotate(-28, { origin: [x, y] }).text(watermarkText, x, y, { width: 250 });
      doc.rotate(28, { origin: [x, y] });
    }
  }
  doc.restore();
}

exports.verifyPdfPayment = async (req, res) => {
  try {
    const ok = await hasValidPdfPayment(req, PDF_FEE);
    if (!ok) {
      return res.status(402).json({
        message: "Valid ₦200 PDF payment is required."
      });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Verify PDF payment error:", err);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

exports.exportLearningPdf = async (req, res) => {
  try {
    const student = await resolveStudent(req);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const paid = await hasValidPdfPayment(req, PDF_FEE);
    if (!paid) {
      return res.status(402).json({ message: "Valid ₦200 PDF payment is required." });
    }

    const title = sanitizeText(req.body?.title || "Learning Content");
    const rawContent = sanitizeText(req.body?.content || "");
    const content = rawContent || "No content supplied.";
    const fileName = sanitizeText(req.body?.fileName || `${title}.pdf`).replace(/[^\w.\- ]+/g, "");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName || "learning-content.pdf"}"`);

    const doc = new PDFDocument({ margin: 46, size: "A4" });
    doc.pipe(res);

    const watermark = buildWatermarkLine(student);
    drawWatermark(doc, watermark);

    doc.fillColor("#111111");
    doc.fontSize(18).text(title, { align: "left" });
    doc.moveDown(1);
    doc.fontSize(11).text(content, {
      align: "left",
      lineGap: 4
    });

    const footer = buildFooterLine(student);
    doc.fontSize(9).fillColor("#444444");
    doc.text(footer, 46, doc.page.height - 40, {
      width: doc.page.width - 92,
      align: "center"
    });

    doc.end();
  } catch (err) {
    console.error("Export learning PDF error:", err);
    return res.status(500).json({ message: "Failed to export PDF" });
  }
};
