(function initPdfExportModule() {
  
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

    const token = getToken();
    const res = await fetch(`${((window.ISA_API_ORIGIN || "") + "")}/api/payments/mock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        amount,
        platform: "pdf_export"
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== "success" || !data.reference) {
      throw new Error(data.message || "Payment failed");
    }
    return data.reference;
  }

  async function verifyPayment(reference) {
    const res = await fetch(`${window.ISA_API_ORIGIN || ""}/api/pdf/verify-payment`, {
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
    const requestBody = payload?.attemptId
      ? {
          reference,
          attemptId: payload.attemptId,
          title: "Mock Attempt Report"
        }
      : {
          reference,
          title: payload?.title || "Learning Content",
          content: payload?.content || "",
          fileName: payload?.fileName || "learning-content.pdf"
        };

    const res = await fetch(`${window.ISA_API_ORIGIN || ""}/api/pdf/download`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(requestBody)
    });
    if (!res.ok) {
      let backendMessage = "";
      try {
        const data = await res.json();
        backendMessage = String(data?.message || data?.error || "").trim();
      } catch (_) {
        try {
          const rawText = await res.text();
          backendMessage = String(rawText || "").trim();
        } catch (_) {
          backendMessage = "";
        }
      }
      const reason = backendMessage || "PDF export failed";
      throw new Error(`HTTP ${res.status}: ${reason}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = payload?.attemptId ? "mock-attempt.pdf" : payload?.fileName || "learning-content.pdf";
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
