const SUMMARY_API_BASE = "http://localhost:5000";

function normalizeCourse(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

async function loadSummary(courseCode) {
  const statusEl = document.getElementById("summaryStatus");
  const contentEl = document.getElementById("summaryContent");
  if (!statusEl || !contentEl) return;

  statusEl.textContent = "Loading summary...";
  contentEl.textContent = "";

  try {
    const res = await fetch(
      `${SUMMARY_API_BASE}/api/summaries?course=${encodeURIComponent(courseCode)}`
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      statusEl.textContent = data.message || "Generate a summary by selecting a course.";
      return;
    }

    const titleEl = document.getElementById("summaryTitle");
    if (titleEl) titleEl.textContent = `${data.courseCode} Summary`;
    statusEl.textContent = "";
    contentEl.textContent = data.content || "Generate a summary by selecting a course.";
  } catch (err) {
    console.error("Load summary error:", err);
    statusEl.textContent = "Generate a summary by selecting a course.";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.ISA_LearningProtection?.activateWatermark();

  await window.ISA_LearningProtection?.addPdfDownloadButton({
    hostSelector: ".page-header",
    buttonText: "Download as PDF",
    fileName: () => {
      const title = document.getElementById("summaryTitle")?.textContent || "course-summary";
      return `${title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    },
    courseCode: () => normalizeCourse(document.getElementById("summaryCourseInput")?.value),
    title: () => document.getElementById("summaryTitle")?.textContent || "Course Summary",
    getContentText: () => document.getElementById("summaryContent")?.innerText || ""
  });

  const params = new URLSearchParams(window.location.search);
  const courseFromQuery = normalizeCourse(params.get("course"));
  const input = document.getElementById("summaryCourseInput");
  if (input && courseFromQuery) input.value = courseFromQuery;

  const loadBtn = document.getElementById("loadSummaryBtn");
  loadBtn?.addEventListener("click", () => {
    const code = normalizeCourse(input?.value);
    if (!code) return;
    loadSummary(code);
  });

  if (courseFromQuery) {
    await loadSummary(courseFromQuery);
  }
});
