const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const Payment = require("../models/Payment");
const Student = require("../models/Student");
const MockAttempt = require("../models/MockAttempt");

const PDF_FEE = 200;

function sanitizeText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function buildWatermarkLine(student) {
  const alias = sanitizeText(student?.studentAlias || "Student");
  const isaStudentId = sanitizeText(student?.isaStudentId || "ISA-00000");
  return `${alias} | ${isaStudentId} | Intensive Study Academy`;
}

async function resolveStudent(req) {
  if (!req.user?.id) return null;

  const student = await Student.findOne({ user_id: req.user.id })
    .select("studentAlias isaStudentId user_id")
    .lean();

  if (!student?.user_id) return null;

  return {
    ...student,
    _id: student.user_id,
  };
}

async function hasValidPdfPayment(req, amount = PDF_FEE) {
  const reference = sanitizeText(req.body?.reference);
  if (!reference) return false;

  const payment = await Payment.findOne({
    student: req.user.id,
    reference,
    status: "success",
    amount: { $gte: amount },
  }).select("_id");

  return Boolean(payment);
}

exports.verifyPdfPayment = async (req, res) => {
  try {
    const ok = await hasValidPdfPayment(req, PDF_FEE);
    if (!ok) {
      return res.status(402).json({
        message: "Valid N200 PDF payment is required.",
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Verify PDF payment error:", err);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

async function getMockAttemptForPdf(attemptId, studentId) {
  return MockAttempt.findOne({
    _id: attemptId,
    studentId,
  }).lean();
}

exports.exportLearningPdf = async (req, res) => {
  let doc;
  try {
    const student = await resolveStudent(req);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const paid = await hasValidPdfPayment(req, PDF_FEE);
    if (!paid) {
      return res.status(402).json({ message: "Valid N200 PDF payment is required." });
    }

    const { attemptId } = req.body;
    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ message: "Valid attemptId is required." });
    }

    const attempt = await getMockAttemptForPdf(attemptId, student._id);
    if (!attempt) {
      return res.status(404).json({ message: "Mock attempt not found." });
    }

    const title = sanitizeText(req.body?.title || "Mock Attempt Report");
    const fileName = sanitizeText(req.body?.fileName || `${title}.pdf`).replace(/[^\w.\- ]+/g, "");

    const questions = (attempt.questions || []).slice(0, 100).map((q, index) => ({
      rank: index + 1,
      question: sanitizeText(q?.question || "-"),
      studentAnswer: sanitizeText(q?.studentAnswer || "No answer"),
      correctAnswer: sanitizeText(q?.correctAnswer || "-"),
    }));

    const submittedDate = new Date(attempt.submittedAt).toLocaleDateString();

    const LOGO_PATH = path.join(__dirname, "../../frontend/assets/isa.png");
    const WEBSITE_URL = "https://www.intensivestudyacademy.com";
    const BRAND_BLUE = "#0f4c81";
    const SOFT_BEIGE = "#f5efe2";
    const BODY_TEXT = "#1f2937";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    doc = new PDFDocument({
      size: "A4",
      margins: { top: 112, right: 48, bottom: 70, left: 48 },
      bufferPages: true,
    });

    doc.on("error", (streamErr) => {
      const details = streamErr?.stack || streamErr?.message || streamErr;
      console.error("PDF stream error:", details);
      if (!res.headersSent) {
        return res.status(500).json({ message: "Failed to export PDF" });
      }
      if (!res.destroyed) {
        res.destroy(streamErr);
      }
    });

    doc.pipe(res);

    const drawPageChrome = () => {
      try {
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const left = doc.page.margins.left;
        const right = pageWidth - doc.page.margins.right;
        const headerHeight = 90;
        const footerHeight = 56;
        const watermarkText = buildWatermarkLine(student);

        doc.save();
        doc.rect(0, 0, pageWidth, headerHeight).fill(SOFT_BEIGE);
        doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight).fill(SOFT_BEIGE);
        doc.restore();

        // Watermark on every page (including first page), stronger but still readable.
        doc.save();
        doc.opacity(0.11);
        doc.font("Helvetica-Bold").fontSize(19).fillColor("#707070");
        const wmX = left + 20;
        const wmPositions = [
          Math.max(headerHeight + 42, Math.floor(pageHeight * 0.38)),
          Math.max(headerHeight + 42, Math.floor(pageHeight * 0.58))
        ];
        wmPositions.forEach((wmY) => {
          doc.rotate(-28, { origin: [wmX, wmY] });
          doc.text(watermarkText, wmX, wmY, { width: right - left - 30, lineBreak: false });
          doc.rotate(28, { origin: [wmX, wmY] });
        });
        doc.restore();

        if (fs.existsSync(LOGO_PATH)) {
          try {
            doc.image(LOGO_PATH, left, 22, { width: 70 });
          } catch (imageErr) {
            console.error("PDF logo render error:", imageErr);
          }
        }

        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .fillColor(BRAND_BLUE)
          .text("Intensive Study Academy", left, 22, {
            width: right - left,
            align: "right",
            link: WEBSITE_URL,
            underline: true,
            lineBreak: false,
          });

        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(BODY_TEXT)
          .text(`Course: ${sanitizeText(attempt.courseCode || "-")}`, left, 42, {
            width: right - left,
            align: "right",
            lineBreak: false,
          })
          .text(`Date: ${submittedDate}`, left, 56, {
            width: right - left,
            align: "right",
            lineBreak: false,
          });

        doc
          .strokeColor(BRAND_BLUE)
          .lineWidth(1)
          .moveTo(left, headerHeight - 1)
          .lineTo(right, headerHeight - 1)
          .stroke();

        doc
          .strokeColor(BRAND_BLUE)
          .lineWidth(1)
          .moveTo(left, pageHeight - footerHeight)
          .lineTo(right, pageHeight - footerHeight)
          .stroke();

      } catch (chromeErr) {
        const details = chromeErr?.stack || chromeErr?.message || chromeErr;
        console.error("PDF page chrome render error:", details);
      }
    };

    drawPageChrome();

    doc.x = doc.page.margins.left;
    doc.y = doc.page.margins.top;

    doc.font("Helvetica-Bold").fontSize(17).fillColor(BRAND_BLUE).text(title, {
      align: "left",
    });

    doc.moveDown(0.6);
    doc
      .strokeColor(BRAND_BLUE)
      .lineWidth(1)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();
    doc.moveDown(0.8);

    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const footerStripHeight = 56;
    const contentBottomY = doc.page.height - footerStripHeight - 14;
    const estimateQuestionBlockHeight = (item) => {
      const rankH = 16;
      const questionLabelH = 14;
      const questionH = doc.heightOfString(item.question, { width: contentWidth, lineGap: 2 });
      const studentLabelH = 14;
      const studentH = doc.heightOfString(item.studentAnswer, { width: contentWidth });
      const correctLabelH = 14;
      const correctH = doc.heightOfString(item.correctAnswer, { width: contentWidth });
      const spacing = 46;
      return rankH + questionLabelH + questionH + studentLabelH + studentH + correctLabelH + correctH + spacing;
    };

    for (const item of questions) {
      const needed = estimateQuestionBlockHeight(item);
      if (doc.y + needed > contentBottomY) {
        doc.addPage();
        drawPageChrome();
        doc.x = doc.page.margins.left;
        doc.y = doc.page.margins.top;
      }

      doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND_BLUE).text(`Rank: ${item.rank}`);
      doc.moveDown(0.25);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BODY_TEXT).text("Question");
      doc.font("Helvetica").fontSize(10).fillColor(BODY_TEXT).text(item.question, { lineGap: 2 });
      doc.moveDown(0.35);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BODY_TEXT).text("Student Answer");
      doc.font("Helvetica").fontSize(10).fillColor(BODY_TEXT).text(item.studentAnswer);
      doc.moveDown(0.35);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BODY_TEXT).text("Correct Answer");
      doc.font("Helvetica").fontSize(10).fillColor(BODY_TEXT).text(item.correctAnswer);
      doc.moveDown(0.65);
      doc
        .strokeColor(BRAND_BLUE)
        .lineWidth(0.5)
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
      doc.moveDown(0.75);
    }

    // Keep this CTA in the same content flow, directly after the last question block.
    const ctaNeeded = 48;
    if (doc.y + ctaNeeded > contentBottomY) {
      doc.addPage();
      drawPageChrome();
      doc.x = doc.page.margins.left;
      doc.y = doc.page.margins.top;
    }
    doc.moveDown(0.4);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(BRAND_BLUE)
      .text(
        "Get more Past Questions, Summary, and Mock Exams at www.intensivestudyacademy.com"
      );
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(BODY_TEXT)
      .text("Call: 08127796978, 07073859837");

    doc.end();
  } catch (err) {
    const details = err?.stack || err?.message || err;
    console.error("Export learning PDF error:", details);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Failed to export PDF" });
    }
    if (doc && !doc.destroyed) {
      try {
        doc.destroy(err);
      } catch (_) {
        // Ignore secondary stream destroy errors.
      }
    }
    if (!res.destroyed) res.destroy(err);
    return;
  }
};

