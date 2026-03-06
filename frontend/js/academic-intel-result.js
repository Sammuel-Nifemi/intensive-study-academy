const API_BASE = window.ISA_API_ORIGIN || "";
const INTEL_RESULT_STORAGE_KEY = "academicIntelLastResult";

function readIntelResult() {
  try {
    const raw = localStorage.getItem(INTEL_RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (err) {
    console.error("Failed to read Academic Intel result:", err);
    return null;
  }
}

async function downloadAiResponsePdf({ title, content }) {
  const token = localStorage.getItem("studentToken");
  const res = await fetch(`${API_BASE}/api/academic-support/export-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  });

  if (!res.ok) {
    let message = "Failed to export PDF.";
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "academic-intel-response.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("intelResultTitle");
  const subtitleEl = document.getElementById("intelResultSubtitle");
  const bodyEl = document.getElementById("intelResultBody");
  const timeEl = document.getElementById("intelResultTime");
  const downloadBtn = document.getElementById("intelDownloadBtn");

  const result = readIntelResult();
  if (!result) {
    if (bodyEl) {
      bodyEl.innerHTML =
        '<div class="intel-empty">No response available yet. Go back and ask Academic Intel.</div>';
    }
    if (downloadBtn) downloadBtn.disabled = true;
    return;
  }

  if (titleEl) titleEl.textContent = String(result.title || "Academic Intel Response");
  if (subtitleEl) subtitleEl.textContent = String(result.subtitle || "Your latest response appears here.");
  if (bodyEl) bodyEl.textContent = String(result.content || "").trim();
  if (timeEl) {
    const when = formatWhen(result.createdAt);
    timeEl.textContent = when ? `Generated: ${when}` : "";
  }
  if (downloadBtn) downloadBtn.disabled = !result.canDownload;

  downloadBtn?.addEventListener("click", async () => {
    const title = String(result.downloadTitle || result.title || "Academic Intel Response");
    const content = String(result.content || "").trim();
    if (!content) return;
    downloadBtn.disabled = true;
    try {
      await downloadAiResponsePdf({ title, content });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to export PDF.");
    } finally {
      downloadBtn.disabled = !result.canDownload;
    }
  });
});
