(function initLearningProtection() {
  const API_BASE = (window.ISA_API_ORIGIN || "") + "";
  const BRAND_LINE = "IntensiveStudyAcademy.com • 08127796978 • 07073859837";

  function normalizeAlias(value) {
    const alias = String(value || "").trim();
    return alias || "Student";
  }

  function normalizeStudentId(value) {
    const id = String(value || "").trim();
    return id || "ISA-00000";
  }

  function buildWatermarkLine(profile) {
    const alias = normalizeAlias(profile?.studentAlias);
    const studentId = normalizeStudentId(profile?.isaStudentId);
    return `${alias} • ${studentId} • ${BRAND_LINE}`;
  }

  function buildFooterLine(profile) {
    const alias = normalizeAlias(profile?.studentAlias);
    const studentId = normalizeStudentId(profile?.isaStudentId);
    return `Generated for ${alias} (${studentId}) • ${BRAND_LINE}`;
  }

  function ensureJsPdf() {
    return Boolean(window.jspdf && window.jspdf.jsPDF);
  }

  async function getStudentProfile() {
    if (window.__isaStudentProfile) return window.__isaStudentProfile;
    if (window.loadStudent) {
      const profile = await window.loadStudent();
      window.__isaStudentProfile = profile || null;
      return window.__isaStudentProfile;
    }
    return null;
  }

  function ensureWatermarkStyle() {
    if (document.getElementById("isaLearningWatermarkStyle")) return;
    const style = document.createElement("style");
    style.id = "isaLearningWatermarkStyle";
    style.textContent = `
      .isa-learning-watermark-overlay {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9998;
        opacity: 0.18;
        background-repeat: repeat;
        background-size: 540px 320px;
      }
      body.isa-learning-protected .dashboard-main,
      body.isa-learning-protected .dashboard-section,
      body.isa-learning-protected .page-header {
        user-select: none;
      }
      body.isa-learning-protected input,
      body.isa-learning-protected textarea {
        user-select: text;
      }
      .isa-download-btn {
        margin-top: 10px;
      }
      .isa-download-host {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px 16px;
        align-items: start;
      }
      .isa-download-host .isa-download-btn {
        grid-column: 2;
        grid-row: 1;
        justify-self: end;
        margin-top: 0;
      }
      .isa-download-host > :not(.isa-download-btn) {
        grid-column: 1;
      }
      @media (max-width: 720px) {
        .isa-download-host {
          grid-template-columns: 1fr;
        }
        .isa-download-host .isa-download-btn {
          grid-column: 1;
          grid-row: auto;
          justify-self: start;
          margin-top: 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setDomWatermark(text) {
    ensureWatermarkStyle();
    let overlay = document.getElementById("isaLearningWatermarkOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "isaLearningWatermarkOverlay";
      overlay.className = "isa-learning-watermark-overlay";
      document.body.appendChild(overlay);
    }

    const safeText = String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='540' height='320'>
        <g transform='rotate(-30 270 160)'>
          <text x='10' y='170' fill='rgba(20,20,20,0.42)' font-size='16' font-family='Arial, sans-serif'>
            ${safeText}
          </text>
        </g>
      </svg>
    `;
    overlay.style.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    document.body.classList.add("isa-learning-protected");
  }

  async function requestPdfPayment(contextCourseCode) {
    const confirmed = window.confirm("Download as PDF costs ₦200. Continue?");
    if (!confirmed) return false;

    const payload = {
      amount: 200,
      platform: "pdf_download",
      courseCode: contextCourseCode || "GENERAL"
    };

    try {
      const res = await fetch(`${API_BASE}/api/payments/mock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status !== "success") {
        alert(data.message || "Payment failed.");
        return false;
      }
      return true;
    } catch (err) {
      console.error("PDF payment error:", err);
      alert("Payment failed.");
      return false;
    }
  }

  function drawPdfWatermark(doc, text) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setTextColor(185, 185, 185);
    doc.setFontSize(11);

    for (let y = 80; y < pageHeight; y += 110) {
      for (let x = -80; x < pageWidth; x += 260) {
        doc.text(text, x, y, { angle: 35 });
      }
    }
    doc.setTextColor(0, 0, 0);
  }

  function drawPdfFooter(doc, footerText) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  async function generatePdf({ title, content, fileName, watermarkText, footerText }) {
    if (!ensureJsPdf()) {
      alert("PDF library not available.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    let y = margin;
    const writePageDecor = () => {
      drawPdfWatermark(doc, watermarkText);
      drawPdfFooter(doc, footerText);
    };

    writePageDecor();
    doc.setFontSize(16);
    doc.text(title || "Learning Content", margin, y);
    y += 24;

    doc.setFontSize(11);
    const lines = doc.splitTextToSize(String(content || "No content available."), contentWidth);
    const lineHeight = 16;

    lines.forEach((line) => {
      if (y > pageHeight - 50) {
        doc.addPage();
        writePageDecor();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    doc.save(fileName || `learning-content-${Date.now()}.pdf`);
  }

  async function addPdfDownloadButton(options) {
    const {
      hostSelector,
      buttonText = "Download as PDF",
      fileName = "learning-content.pdf",
      courseCode = "",
      title = "Learning Content",
      getContentText
    } = options || {};

    const host = document.querySelector(hostSelector);
    if (!host) return;
    if (host.querySelector(".isa-download-btn")) return;
    host.classList.add("isa-download-host");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "primary-btn isa-download-btn";
    btn.textContent = buttonText;
    host.appendChild(btn);

    btn.addEventListener("click", async () => {
      const paid = await requestPdfPayment(
        typeof courseCode === "function" ? courseCode() : courseCode
      );
      if (!paid) return;

      const profile = await getStudentProfile();
      const watermarkText = buildWatermarkLine(profile);
      const footerText = buildFooterLine(profile);
      const content = typeof getContentText === "function" ? getContentText() : "";

      await generatePdf({
        title: typeof title === "function" ? title() : title,
        content,
        fileName: typeof fileName === "function" ? fileName() : fileName,
        watermarkText,
        footerText
      });
    });
  }

  async function activateWatermark() {
    const profile = await getStudentProfile();
    const line = buildWatermarkLine(profile);
    setDomWatermark(line);
  }

  window.ISA_LearningProtection = {
    activateWatermark,
    addPdfDownloadButton,
    getStudentProfile,
    buildWatermarkLine,
    buildFooterLine
  };
})();
