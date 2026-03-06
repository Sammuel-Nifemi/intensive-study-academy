(function initMockPostExam() {
  const HISTORY_KEY = "mockExamHistory";
  const LAST_KEY = "mockExamLastAttempt";
  const HISTORY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
  const MAX_ATTEMPTS_PER_COURSE = 3;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Number(seconds || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function getMockHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      const rows = Array.isArray(parsed) ? parsed : [];
      const now = Date.now();
      const withinRetention = rows.filter((item) => {
        const ts = Date.parse(item?.submittedAt || "");
        if (!Number.isFinite(ts)) return false;
        return now - ts <= HISTORY_RETENTION_MS;
      });

      // Keep only latest N attempts per course.
      const perCourseCount = new Map();
      const kept = [];
      for (const item of withinRetention) {
        const key = String(item?.courseCode || "MOCK").toUpperCase();
        const count = Number(perCourseCount.get(key) || 0);
        if (count >= MAX_ATTEMPTS_PER_COURSE) continue;
        kept.push(item);
        perCourseCount.set(key, count + 1);
      }

      if (kept.length !== rows.length) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(kept));
        const latest = kept[0] || null;
        if (latest) {
          localStorage.setItem(LAST_KEY, JSON.stringify(latest));
        } else {
          localStorage.removeItem(LAST_KEY);
        }
      }

      return kept;
    } catch (err) {
      return [];
    }
  }

  function saveMockAttempt(attempt) {
    const history = getMockHistory();
    const record = {
      ...attempt,
      submittedAt: attempt.submittedAt || new Date().toISOString()
    };
    history.unshift(record);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.setItem(LAST_KEY, JSON.stringify(record));
    return record;
  }

  function getCurrentMockAttempt() {
    const params = new URLSearchParams(window.location.search);
    const attemptId = params.get("attemptId");
    const history = getMockHistory();

    if (attemptId) {
      const found = history.find((item) => item.attemptId === attemptId);
      if (found) return found;
    }

    try {
      return JSON.parse(localStorage.getItem(LAST_KEY) || "null");
    } catch (err) {
      return null;
    }
  }

  function getCurrentMockAttemptOrRedirect(fallbackUrl) {
    const current = getCurrentMockAttempt();
    if (!current) {
      window.location.href = fallbackUrl;
      return null;
    }
    return current;
  }

  function renderDonut(config) {
    const donut = document.querySelector(config.selector);
    const percentEl = document.querySelector(config.percentSelector);
    const metaEl = document.querySelector(config.metaSelector);
    const percent = Math.max(0, Math.min(100, Number(config.percent || 0)));

    if (donut) donut.style.setProperty("--score", String(percent));
    if (percentEl) percentEl.textContent = `${Math.round(percent)}%`;
    if (metaEl) metaEl.textContent = `${config.correct || 0} / ${config.total || 0} Correct`;
  }

  function renderMockPostSidebar(activeTab) {
    const sidebar = document.getElementById("mockPostSidebar");
    if (!sidebar) return;

    sidebar.innerHTML = `
      <ul class="sidebar-top">
        <li><a href="/frontend/pages/mock-exams.html"><strong>Mock Exams</strong></a></li>
        <li><a href="/frontend/pages/student-dashboard.html">Main Dashboard</a></li>
      </ul>
    `;
  }

  window.MockPostExam = {
    escapeHtml,
    formatDuration,
    getMockHistory,
    saveMockAttempt,
    getCurrentMockAttempt,
    getCurrentMockAttemptOrRedirect,
    renderDonut,
    renderMockPostSidebar
  };
})();

