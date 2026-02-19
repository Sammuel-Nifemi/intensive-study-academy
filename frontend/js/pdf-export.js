(function initPdfExportModule() {
  const API_BASE = "http://localhost:5000";
  const PDF_FEE = 200;

  function getToken() {
    return localStorage.getItem("studentToken");
  }

  function headers(extra = {}) {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra
    };
  }

  async function requestFeePayment(amount = PDF_FEE) {
    const ok = window.confirm(`Download as PDF costs ₦${amount}. Continue?`);
    if (!ok) return null;

    const res = await fetch(`${API_BASE}/api/payments/mock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        platform: "pdf_export",
        courseCode: "GENERAL"
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== "success" || !data.reference) {
      throw new Error(data.message || "Payment failed");
    }
    return data.reference;
  }

  async function verifyPayment(reference) {
    const res = await fetch(`${API_BASE}/api/pdf-export/verify-payment`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ reference })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Payment verification failed");
    }
  }

  async function downloadPdf(payload) {
    const reference = payload?.reference;
    const res = await fetch(`${API_BASE}/api/pdf-export/download`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        reference,
        title: payload?.title || "Learning Content",
        content: payload?.content || "",
        fileName: payload?.fileName || "learning-content.pdf"
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "PDF export failed");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = payload?.fileName || "learning-content.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async function payAndExport(payload) {
    const reference = await requestFeePayment(PDF_FEE);
    if (!reference) return;
    await verifyPayment(reference);
    await downloadPdf({
      ...payload,
      reference
    });
  }

  window.PDFExport = {
    payAndExport,
    requestFeePayment,
    verifyPayment,
    downloadPdf
  };
})();
