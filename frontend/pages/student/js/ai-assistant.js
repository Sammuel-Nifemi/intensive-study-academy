const API_BASE = (window.ISA_API_ORIGIN || "") + "";
let allCourses = [];
let selectedCourseForExplanation = "";
let selectedCourseIdForExplanation = "";
let renderedCourseCount = 0;

function setCourseListMeta(text) {
  const meta = document.getElementById("courseListMeta");
  if (meta) meta.textContent = text;
}

function setCourseListPanelOpen(isOpen) {
  const panel = document.getElementById("courseListPanel");
  const toggle = document.getElementById("courseListToggle");
  if (!panel || !toggle) return;
  panel.hidden = !isOpen;
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  const count = renderedCourseCount;
  setCourseListMeta(isOpen ? `Hide (${count})` : `Open (${count})`);
}

function initCourseListAccordion() {
  const toggle = document.getElementById("courseListToggle");
  if (!toggle || toggle.dataset.wired === "1") return;
  toggle.dataset.wired = "1";
  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setCourseListPanelOpen(!isOpen);
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function authFetch(url, options = {}) {
  const token = localStorage.getItem("studentToken");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}

async function askAdvisor(question, course) {
  const res = await authFetch(`${API_BASE}/api/academic-support/ask`, {
    method: "POST",
    body: JSON.stringify({ question, course: course || undefined })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to get advisor response.");
  return data.answer || "No response returned.";
}

async function explainCourseById(courseId) {
  const res = await authFetch(`${API_BASE}/api/academic-support/explain-course`, {
    method: "POST",
    body: JSON.stringify({ courseId })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to explain course.");
  return data;
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
  link.download = "ai-explanation.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function loadAdvisorFeedbackFromMockAttempt(attemptId) {
  try {
    const res = await authFetch(`${API_BASE}/api/academic-support/advisor-feedback/${encodeURIComponent(attemptId)}`, {
      method: "GET"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setText("advisorFeedbackText", data.message || "Failed to load advisor feedback.");
      return;
    }
    setText("advisorFeedbackText", data.feedback || "No advisor feedback available.");
  } catch (err) {
    console.error(err);
    setText("advisorFeedbackText", "Failed to load advisor feedback.");
  }
}

function setActiveActionCard(action) {
  document.querySelectorAll(".quick-card").forEach((card) => {
    card.classList.toggle("active", card.getAttribute("data-action") === action);
  });
}

function showActionSection(action) {
  const explainSection = document.getElementById("explainCourseSection");
  if (explainSection) {
    explainSection.classList.toggle("hidden", action !== "explain-course");
  }

  const input = document.getElementById("advisorQuestionInput");
  if (!input) return;

  if (action === "exam-prep" && !input.value.trim()) {
    input.value = "Give me a practical exam preparation plan for this week based on my mock performance.";
  }

  if (action === "summarize-materials" && !input.value.trim()) {
    input.value = "Summarize my course material in simple language with real-life examples.";
  }

  if (action === "study-planning" && !input.value.trim()) {
    input.value = "Create a simple daily study plan I can follow this week.";
  }
}

function renderCourseCards(filterText) {
  const grid = document.getElementById("courseGrid");
  const status = document.getElementById("courseSearchStatus");
  if (!grid || !status) return;

  const q = String(filterText || "").trim().toLowerCase();
  const rows = allCourses.filter((row) => {
    if (!q) return true;
    return String(row.courseCode || "").toLowerCase().includes(q) || String(row.title || "").toLowerCase().includes(q);
  });

  if (!rows.length) {
    renderedCourseCount = 0;
    grid.innerHTML = "";
    status.textContent = "No courses match your search.";
    setCourseListMeta("Open (0)");
    return;
  }

  status.textContent = "";
  renderedCourseCount = rows.length;
  grid.innerHTML = rows
    .map((row) => `
      <article class="course-accordion" data-course-id="${row.id}" data-course="${row.courseCode}">
        <button type="button" class="course-accordion-toggle" aria-expanded="false">
          <span class="course-accordion-main">
            <strong>${row.courseCode}</strong>
            <span>${row.title}</span>
          </span>
          <span class="course-accordion-icon">+</span>
        </button>
        <div class="course-accordion-body">
          <button type="button" class="primary-btn explain-course-btn">Explain Course</button>
        </div>
      </article>
    `)
    .join("");

  setCourseListMeta(`Open (${renderedCourseCount})`);
}

async function loadCourses() {
  const status = document.getElementById("courseSearchStatus");
  if (status) status.textContent = "Loading courses...";
  try {
    const res = await authFetch(`${API_BASE}/api/courses`, { method: "GET" });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      if (status) status.textContent = data.message || "Failed to load courses.";
      return;
    }

    allCourses = (Array.isArray(data) ? data : []).map((item) => ({
      id: String(item._id || item.id || ""),
      courseCode: String(item.courseCode || item.code || "").toUpperCase(),
      title: String(item.title || item.name || item.courseCode || "")
    })).filter((item) => item.id && item.courseCode);

    if (!allCourses.length && status) {
      status.textContent = "Courses not loaded. Please refresh.";
      return;
    }

    renderCourseCards("");
  } catch (err) {
    console.error(err);
    if (status) status.textContent = "Courses not loaded. Please refresh.";
  }
}

function wireQuickActions() {
  document.querySelectorAll(".quick-card").forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.getAttribute("data-action");
      setActiveActionCard(action);
      showActionSection(action);
    });
  });
}

function wireCourseExplainFlow() {
  const searchInput = document.getElementById("courseSearchInput");
  const grid = document.getElementById("courseGrid");
  const resultWrap = document.getElementById("courseExplainResult");
  const resultText = document.getElementById("courseExplainText");
  const downloadBtn = document.getElementById("downloadCourseExplainPdfBtn");
  if (downloadBtn) {
    downloadBtn.textContent = "\uD83D\uDCC4 Download as PDF";
    downloadBtn.style.background = "#0f766e";
    downloadBtn.style.color = "#fff";
    downloadBtn.style.border = "0";
    downloadBtn.disabled = true;
  }

  searchInput?.addEventListener("input", () => renderCourseCards(searchInput.value));

  grid?.addEventListener("click", async (event) => {
    const toggle = event.target.closest(".course-accordion-toggle");
    if (toggle) {
      const accordion = toggle.closest(".course-accordion");
      if (!accordion) return;
      const isOpen = accordion.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      const icon = toggle.querySelector(".course-accordion-icon");
      if (icon) icon.textContent = isOpen ? "-" : "+";
      return;
    }

    const btn = event.target.closest(".explain-course-btn");
    if (!btn) return;
    const card = btn.closest(".course-accordion");
    if (!card) return;

    const courseId = card.getAttribute("data-course-id");
    const courseCode = card.getAttribute("data-course");
    if (!courseId || !courseCode) return;

    setText("courseSearchStatus", "Generating course explanation...");
    try {
      selectedCourseIdForExplanation = courseId;
      selectedCourseForExplanation = courseCode;
      const response = await explainCourseById(courseId);
      const answer = String(response.answer || "").trim();
      if (resultText) resultText.textContent = answer;
      if (resultWrap) resultWrap.hidden = false;
      if (downloadBtn) downloadBtn.disabled = !String(answer || "").trim();
      setText("courseSearchStatus", "");
    } catch (err) {
      if (downloadBtn) downloadBtn.disabled = true;
      setText("courseSearchStatus", err.message);
    }
  });

  downloadBtn?.addEventListener("click", async () => {
    const content = document.getElementById("courseExplainText")?.textContent?.trim();
    if (!content || !selectedCourseIdForExplanation) return;
    const code = selectedCourseForExplanation || "GENERAL";
    downloadBtn.disabled = true;
    try {
      await downloadAiResponsePdf({
        title: `Course Explanation - ${code}`,
        content
      });
    } catch (err) {
      console.error(err);
      setText("courseSearchStatus", err.message || "Failed to export PDF.");
    } finally {
      downloadBtn.disabled = false;
    }
  });
}

function wireAskAdvisor() {
  const btn = document.getElementById("askAdvisorBtn");
  const input = document.getElementById("advisorQuestionInput");
  const status = document.getElementById("askAdvisorStatus");
  const wrap = document.getElementById("advisorAnswerWrap");
  const text = document.getElementById("advisorAnswerText");
  let downloadBtn = document.getElementById("downloadAdvisorReplyPdfBtn");

  if (!downloadBtn && wrap) {
    downloadBtn = document.createElement("button");
    downloadBtn.id = "downloadAdvisorReplyPdfBtn";
    downloadBtn.type = "button";
    downloadBtn.textContent = "\uD83D\uDCC4 Download as PDF";
    downloadBtn.className = "primary-btn";
    downloadBtn.style.marginTop = "10px";
    downloadBtn.style.background = "#0f766e";
    downloadBtn.style.color = "#fff";
    downloadBtn.style.border = "0";
    downloadBtn.disabled = true;
    wrap.appendChild(downloadBtn);
  }

  btn?.addEventListener("click", async () => {
    const question = String(input?.value || "").trim();
    if (!question) {
      setText("askAdvisorStatus", "Please enter a question.");
      return;
    }

    setText("askAdvisorStatus", "Thinking...");
    if (btn) btn.disabled = true;
    try {
      const answer = await askAdvisor(question, "");
      if (text) text.textContent = answer;
      if (wrap) wrap.hidden = false;
      if (downloadBtn) {
        downloadBtn.disabled = !String(answer || "").trim();
      }
      setText("askAdvisorStatus", "");
    } catch (err) {
      if (downloadBtn) downloadBtn.disabled = true;
      setText("askAdvisorStatus", err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  downloadBtn?.addEventListener("click", async () => {
    const content = String(text?.textContent || "").trim();
    if (!content) return;
    downloadBtn.disabled = true;
    try {
      await downloadAiResponsePdf({
        title: "AI Advisor Response",
        content
      });
    } catch (err) {
      console.error(err);
      setText("askAdvisorStatus", err.message || "Failed to export PDF.");
    } finally {
      downloadBtn.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const source = String(params.get("source") || "").trim().toLowerCase();
  const attemptId = String(params.get("attemptId") || "").trim();
  const advisorSection = document.getElementById("advisorFeedbackSection");

  if (source === "mock" && attemptId && advisorSection) {
    advisorSection.classList.remove("hidden");
    await loadAdvisorFeedbackFromMockAttempt(attemptId);
  } else if (advisorSection) {
    advisorSection.classList.add("hidden");
  }

  wireQuickActions();
  initCourseListAccordion();
  setCourseListPanelOpen(false);
  wireCourseExplainFlow();
  wireAskAdvisor();
  await loadCourses();

  await window.ISA_LearningProtection?.activateWatermark();
});

