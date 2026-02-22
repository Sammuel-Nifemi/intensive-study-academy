const STUDENT_CACHE_KEY = "studentProfileCache";

function readStudentCache() {
  try {
    const raw = localStorage.getItem(STUDENT_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStudentCache(profile) {
  try {
    localStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // ignore cache write errors
  }
}

function wrapFetchForRedirect() {
  if (window.__studentFetchWrapped) return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const res = await originalFetch(...args);
    if (res.status === 403) {
      try {
        const clone = res.clone();
        const data = await clone.json();
        if (data?.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } catch {
        // ignore JSON parse failures
      }
    }
    return res;
  };
  window.__studentFetchWrapped = true;
}

async function loadStudent({ force = false } = {}) {
  const token = localStorage.getItem("studentToken");
  if (!token) {
    window.location.href = "/pages/student-login.html";
    return null;
  }

  const cached = readStudentCache();
  if (cached && !force) {
    return cached;
  }

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/student/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      localStorage.removeItem("studentToken");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("role");
      window.location.href = "/pages/student-login.html";
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    writeStudentCache(data);
    return data;
  } catch (err) {
    console.error("Auth check failed", err);
    return null;
  }
}

window.loadStudent = window.loadStudent || loadStudent;
window.readStudentCache = window.readStudentCache || readStudentCache;

(async function protectStudentPage() {
  const token = localStorage.getItem("studentToken");
  window.NOTIFICATION_TOKEN = token;

  // No token -> login
  if (!token) {
    window.location.href = "/pages/student-login.html";
    return;
  }

  wrapFetchForRedirect();

  const data = await loadStudent();
  if (!data) {
    window.location.href = "/pages/student-login.html";
    return;
  }

  const path = window.location.pathname;
  const isDashboard = path.includes("student-dashboard");
  const isCompleteProfile = path.includes("complete-profile");
  if (!data.profileCompleted && !isDashboard && !isCompleteProfile) {
    window.location.href = "/pages/complete-profile.html";
  }
})();

