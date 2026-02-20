
// ===============================
// STUDENT AUTH GUARD (PROTECTED PAGES ONLY)
// ===============================

const STUDENT_CACHE_KEY = "studentProfileCache";
const STUDENT_CACHE_TOKEN_KEY = "studentProfileCacheToken";

function readStudentCache() {
  try {
    const activeToken = localStorage.getItem("studentToken");
    const cachedToken = localStorage.getItem(STUDENT_CACHE_TOKEN_KEY);
    const raw = localStorage.getItem(STUDENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Legacy support: older versions stored only the profile object.
    if (parsed && typeof parsed === "object" && !parsed.profile) {
      if (activeToken && cachedToken && cachedToken === activeToken) {
        return parsed;
      }
      return null;
    }

    if (!parsed?.profile) return null;
    if (!activeToken || !cachedToken || cachedToken !== activeToken) {
      return null;
    }
    return parsed.profile;
  } catch {
    return null;
  }
}

function clearStudentCache() {
  try {
    localStorage.removeItem(STUDENT_CACHE_KEY);
    localStorage.removeItem(STUDENT_CACHE_TOKEN_KEY);
  } catch {
    // ignore cache clear errors
  }
}

function readStudentCacheForToken(token) {
  const cachedProfile = readStudentCache();
  const cachedToken = localStorage.getItem(STUDENT_CACHE_TOKEN_KEY);
  if (!cachedProfile) return null;
  if (!cachedToken || cachedToken !== token) return null;
  return cachedProfile;
}

function writeStudentCache(profile) {
  try {
    const token = localStorage.getItem("studentToken");
    localStorage.setItem(
      STUDENT_CACHE_KEY,
      JSON.stringify({
        profile,
        cachedAt: Date.now()
      })
    );
    if (token) {
      localStorage.setItem(STUDENT_CACHE_TOKEN_KEY, token);
    }
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
    clearStudentCache();
    window.location.href = "/frontend/pages/student-login.html";
    return null;
  }

  const cached = readStudentCacheForToken(token);
  if (cached && !force) {
    return cached;
  }

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/student/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      localStorage.removeItem("studentToken");
      clearStudentCache();
      window.location.href = "/frontend/pages/student-login.html";
      return null;
    }

    if (!res.ok) {
      return cached || null;
    }

    const profile = await res.json();
    writeStudentCache(profile);
    return profile;
  } catch (err) {
    console.error("Student profile fetch failed", err);
    return cached || null;
  }
}

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getStudentDisplayName(profile) {
  return profile?.fullName || profile?.name || "Student";
}

function getHeaderPageLabel(pathname = window.location.pathname) {
  if (pathname.includes("student-dashboard")) return "Dashboard";
  if (pathname.includes("student-profile")) return "Profile";
  if (pathname.includes("mock") || pathname.includes("cbt")) return "Mock";
  if (pathname.includes("course-materials")) return "Dashboard";
  return "Dashboard";
}

function ensureHeaderPageLabel() {
  const headerContainer = document.querySelector(".dashboard-header .header-container");
  if (!headerContainer) return null;

  let label = document.getElementById("headerPageLabel");
  if (label) return label;

  const notificationWrapper = headerContainer.querySelector(".notification-wrapper");
  label = document.createElement("span");
  label.id = "headerPageLabel";
  label.className = "header-page-label";

  if (notificationWrapper) {
    headerContainer.insertBefore(label, notificationWrapper);
  } else {
    headerContainer.appendChild(label);
  }

  return label;
}

function hydrateStudentHeader(profile) {
  const headerName = document.getElementById("studentName");
  if (headerName) {
    headerName.textContent = `${getTimeGreeting()}, ${getStudentDisplayName(profile)}`;
  }

  const label = ensureHeaderPageLabel();
  if (label) {
    label.textContent = getHeaderPageLabel();
  }
}

window.loadStudent = window.loadStudent || loadStudent;
window.readStudentCache = window.readStudentCache || readStudentCache;
window.getStudentDisplayName = window.getStudentDisplayName || getStudentDisplayName;
window.getTimeGreeting = window.getTimeGreeting || getTimeGreeting;
window.hydrateStudentHeader = window.hydrateStudentHeader || hydrateStudentHeader;

document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;
  const isPublic =
    path.includes("student-login") ||
    path.includes("student-registration");

  if (isPublic) return;

  const token = localStorage.getItem("studentToken");
  window.NOTIFICATION_TOKEN = token;

  if (!token) {
    window.location.href = "/frontend/pages/student-login.html";
    return;
  }

  const cachedProfile = readStudentCacheForToken(token);
  if (cachedProfile) {
    hydrateStudentHeader(cachedProfile);
  }

  wrapFetchForRedirect();
  bindStudentLogout();

  const profile = await loadStudent({ force: !cachedProfile });
  if (!profile) {
    // Keep current page stable unless token is truly invalid (401 handled in loadStudent).
    return;
  }
  hydrateStudentHeader(profile);

  const isDashboard = path.includes("student-dashboard");
  const isCompleteProfile = path.includes("complete-profile");
  if (!profile.profileCompleted && !isDashboard && !isCompleteProfile) {
    window.location.href = "/frontend/pages/complete-profile.html";
  }
});

function bindStudentLogout() {
  const logoutButtons = document.querySelectorAll("#logoutBtn, #logoutBtnInline, .logout-btn");
  if (!logoutButtons.length) return;

  const logout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    clearStudentCache();
    window.location.href = "/frontend/pages/student-login.html";
  };

  logoutButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
    });
  });
}

