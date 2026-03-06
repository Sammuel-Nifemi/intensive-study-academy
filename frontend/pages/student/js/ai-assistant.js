const API_BASE = (window.ISA_API_ORIGIN || "") + "";
let allCourses = [];
let selectedCourseForExplanation = "";
let selectedCourseIdForExplanation = "";
let renderedCourseCount = 0;
let latestIntelResult = { title: "", content: "" };
const INTEL_RESULT_STORAGE_KEY = "academicIntelLastResult";
const AI_WARMUP_MESSAGE =
  "AI Assistant is warming up :)\nSome features are still being connected.\nPlease try again later or contact support.";

function ensureLockedFeatureModalApi() {
  if (window.lockedFeatureModal?.open) return;
  const overlay = document.createElement("div");
  overlay.id = "lockedFeatureModal";
  overlay.style.cssText =
    "position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.6);z-index:9999;padding:16px;";
  overlay.innerHTML = `
    <div role="dialog" aria-modal="true" aria-labelledby="lfmTitle" style="width:min(420px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 18px 40px rgba(2,6,23,.32);padding:18px;text-align:center;">
      <div aria-hidden="true" style="font-size:1.15rem;line-height:1;margin-bottom:8px;">&#128274;</div>
      <h3 id="lfmTitle" style="margin:0;color:#0f172a;font-size:1.05rem;">Academic Intel is Temporarily Locked</h3>
      <p id="lfmBody" style="margin:10px 0 16px;color:#334155;line-height:1.5;white-space:pre-line;">We are upgrading the intelligence engine.\nAI-powered course analysis will be available soon.</p>
      <button id="lfmOkayBtn" type="button" class="primary-btn" style="min-width:96px;">Okay</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.style.display = "none";
  });
  overlay.querySelector("#lfmOkayBtn")?.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  window.lockedFeatureModal = {
    open(options = {}) {
      const title = String(options.title || "Academic Intel is Temporarily Locked");
      const body = String(
        options.body ||
          "We are upgrading the intelligence engine.\nAI-powered course analysis will be available soon."
      );
      const titleEl = overlay.querySelector("#lfmTitle");
      const bodyEl = overlay.querySelector("#lfmBody");
      if (titleEl) titleEl.textContent = title;
      if (bodyEl) bodyEl.textContent = body;
      overlay.style.display = "flex";
    },
    close() {
      overlay.style.display = "none";
    }
  };
}

function showLockedFeatureModal() {
  ensureLockedFeatureModalApi();
  if (window.lockedFeatureModal?.open) {
    window.lockedFeatureModal.open();
  }
}

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

function createAiUnavailableError() {
  const err = new Error("AI_UNAVAILABLE");
  err.code = "AI_UNAVAILABLE";
  return err;
}

function isAiUnavailablePayload(data, resOk) {
  const message = String(data?.message || "").toLowerCase();
  if (data && data.success === false) return true;
  if (!resOk) {
    return (
      message.includes("quota") ||
      message.includes("billing") ||
      message.includes("insufficient_quota") ||
      message.includes("ai assistant is temporarily unavailable")
    );
  }
  return false;
}

function showAiWarmupInCard(textEl, wrapEl) {
  if (textEl) textEl.textContent = AI_WARMUP_MESSAGE;
  if (wrapEl) wrapEl.hidden = false;
}

function ensureIntelResultView() {
  let section = document.getElementById("intelResultView");
  if (section) return section;

  const main = document.querySelector(".dashboard-main");
  if (!main) return null;

  section = document.createElement("section");
  section.id = "intelResultView";
  section.className = "dashboard-section";
  section.hidden = true;
  section.innerHTML = `
    <div class="intel-result-view">
      <div class="intel-result-head">
        <div>
          <h2 id="intelResultTitle" class="intel-result-title">Academic Intel Response</h2>
          <p id="intelResultSubtitle" class="intel-result-subtitle">Your generated guidance appears here.</p>
        </div>
        <button id="intelResultBackBtn" class="secondary-btn" type="button">Back</button>
      </div>
      <div id="intelResultBody" class="intel-result-body"></div>
      <div class="intel-result-actions">
        <button id="intelResultDownloadBtn" class="primary-btn" type="button">Download as PDF</button>
      </div>
    </div>
  `;

  const anchor = main.querySelector(".isa-notice-card");
  if (anchor?.nextSibling) {
    main.insertBefore(section, anchor.nextSibling);
  } else {
    main.prepend(section);
  }

  return section;
}

function openIntelResultView({ title, subtitle, content, canDownload, downloadTitle }) {
  const resultSection = ensureIntelResultView();
  const resultTitle = document.getElementById("intelResultTitle");
  const resultSubtitle = document.getElementById("intelResultSubtitle");
  const resultBody = document.getElementById("intelResultBody");
  const downloadBtn = document.getElementById("intelResultDownloadBtn");
  if (!resultSection || !resultTitle || !resultSubtitle || !resultBody || !downloadBtn) return;

  resultTitle.textContent = title || "Academic Intel Response";
  resultSubtitle.textContent = subtitle || "Your generated guidance appears here.";
  resultBody.textContent = String(content || "").trim();
  resultSection.hidden = false;
  resultSection.classList.remove("hidden");
  downloadBtn.disabled = !canDownload;
  latestIntelResult = {
    title: downloadTitle || resultTitle.textContent,
    content: String(content || "").trim()
  };

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeIntelResultView() {
  const resultSection = document.getElementById("intelResultView");
  if (!resultSection) return;
  resultSection.hidden = true;
  resultSection.classList.add("hidden");
}

function saveIntelResultAndRedirect({ title, subtitle, content, canDownload, downloadTitle, source, courseCode }) {
  const payload = {
    title: String(title || "Academic Intel Response"),
    subtitle: String(subtitle || ""),
    content: String(content || "").trim(),
    canDownload: Boolean(canDownload),
    downloadTitle: String(downloadTitle || title || "Academic Intel Response"),
    source: String(source || "ask"),
    courseCode: String(courseCode || ""),
    createdAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(INTEL_RESULT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to store Academic Intel result:", err);
  }

  window.location.href = "/frontend/pages/academic-intel-result.html";
}

function wireIntelResultView() {
  ensureIntelResultView();
  const backBtn = document.getElementById("intelResultBackBtn");
  const downloadBtn = document.getElementById("intelResultDownloadBtn");
  const status = document.getElementById("askAdvisorStatus");

  backBtn?.addEventListener("click", closeIntelResultView);

  downloadBtn?.addEventListener("click", async () => {
    const title = String(latestIntelResult.title || "").trim();
    const content = String(latestIntelResult.content || "").trim();
    if (!content) return;
    downloadBtn.disabled = true;
    try {
      await downloadAiResponsePdf({ title, content });
    } catch (err) {
      console.error(err);
      if (status) status.textContent = err.message || "Failed to export PDF.";
    } finally {
      downloadBtn.disabled = false;
    }
  });
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
  if (isAiUnavailablePayload(data, res.ok)) throw createAiUnavailableError();
  if (!res.ok) throw new Error(data.message || "Failed to get advisor response.");
  return data.answer || "No response returned.";
}

async function explainCourseById(courseId) {
  const res = await authFetch(`${API_BASE}/api/academic-support/explain-course`, {
    method: "POST",
    body: JSON.stringify({ courseId })
  });
  const data = await res.json().catch(() => ({}));
  if (isAiUnavailablePayload(data, res.ok)) throw createAiUnavailableError();
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
    if (data && data.success === false) {
      setText("advisorFeedbackText", AI_WARMUP_MESSAGE);
      return;
    }
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
  const promptByAction = {
    "explain-course": "Explain this course in simple terms, with key topics I should focus on for exams.",
    "exam-prep": "Give me a practical exam preparation plan for this week based on my mock performance.",
    "summarize-materials": "Summarize my course material in simple language with real-life examples.",
    "study-planning": "Create a simple daily study plan I can follow this week."
  };

  input.value = promptByAction[action] || "";
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  input.scrollIntoView({ block: "center", behavior: "smooth" });
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
  if (resultWrap) resultWrap.hidden = true;
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
      if (resultText) resultText.textContent = "";
      if (resultWrap) resultWrap.hidden = true;
      if (downloadBtn) downloadBtn.disabled = !String(answer || "").trim();
      saveIntelResultAndRedirect({
        title: "Course Explanation",
        subtitle: `Course: ${courseCode}`,
        content: answer,
        canDownload: Boolean(String(answer || "").trim()),
        downloadTitle: `Course Explanation - ${courseCode}`,
        source: "course_explain",
        courseCode
      });
      setText("courseSearchStatus", "");
    } catch (err) {
      if (downloadBtn) downloadBtn.disabled = true;
      if (err && err.code === "AI_UNAVAILABLE") {
        setText("courseSearchStatus", "");
        if (resultText) resultText.textContent = "";
        if (resultWrap) resultWrap.hidden = true;
        saveIntelResultAndRedirect({
          title: "Course Explanation",
          subtitle: `Course: ${courseCode}`,
          content: AI_WARMUP_MESSAGE,
          canDownload: false,
          downloadTitle: `Course Explanation - ${courseCode}`,
          source: "course_explain",
          courseCode
        });
      } else {
        setText("courseSearchStatus", err.message);
      }
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
  if (wrap) wrap.hidden = true;
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

  btn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setText("askAdvisorStatus", "");
    if (text) text.textContent = "";
    if (wrap) wrap.hidden = true;
    if (downloadBtn) downloadBtn.disabled = true;
    showLockedFeatureModal();
  });

  downloadBtn?.addEventListener("click", async () => {
    const content = String(text?.textContent || "").trim();
    if (!content) return;
    downloadBtn.disabled = true;
    try {
      await downloadAiResponsePdf({
        title: "Academic Intel Response",
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
  wireIntelResultView();
  initCourseListAccordion();
  setCourseListPanelOpen(false);
  wireCourseExplainFlow();
  wireAskAdvisor();
  await loadCourses();

  await window.ISA_LearningProtection?.activateWatermark();
});

