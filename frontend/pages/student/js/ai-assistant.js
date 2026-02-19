const API_BASE = "http://localhost:5000";
let allCourses = [];
let selectedCourseForExplanation = "";
let selectedCourseIdForExplanation = "";

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
    grid.innerHTML = "";
    status.textContent = "No courses match your search.";
    return;
  }

  status.textContent = "";
  grid.innerHTML = rows
    .map((row) => `
      <article class="course-card" data-course-id="${row.id}" data-course="${row.courseCode}">
        <h4>${row.courseCode}</h4>
        <p>${row.title}</p>
      </article>
    `)
    .join("");
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
    const card = event.target.closest(".course-card");
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
  wireCourseExplainFlow();
  wireAskAdvisor();
  await loadCourses();

  await window.ISA_LearningProtection?.activateWatermark();
});

