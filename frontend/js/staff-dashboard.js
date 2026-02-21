// Dashboard = work overview only (no identity editing).
function getStaffToken() {
  return localStorage.getItem("staffToken");
}

let sessionErrorHandled = false;
let loaderTimeoutId = null;

function handleSessionError(error) {
  if (sessionErrorHandled) return;
  sessionErrorHandled = true;
  console.error(error);
  alert("Session expired. Please login again.");
  localStorage.removeItem("staffToken");
  window.location.href = "./staff-login.html";
}

function setLoaderState(message, isError = false) {
  const loader = document.getElementById("staffLoader");
  const text = document.getElementById("staffLoaderText");
  if (!loader || !text) return;
  loader.classList.toggle("error", Boolean(isError));
  text.textContent = message;
}

function showDashboard() {
  const loader = document.getElementById("staffLoader");
  const app = document.getElementById("staffApp");
  if (loader) loader.style.display = "none";
  if (app) app.style.display = "flex";
}

async function fetchStaffMe() {
  const token = getStaffToken();
  if (!token) {
    throw new Error("Missing staff token");
  }

  const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 401 || !res.ok) {
    throw new Error("Unauthorized staff session");
  }
  const payload = await res.json();
  if (!payload?.success) {
    throw new Error("Invalid staff profile response");
  }
  return payload.data;
}

function setStatus(el, message, type) {
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("error", "success", "loading");
  if (type) el.classList.add(type);
}

function toggleProgress(el, isLoading) {
  if (!el) return;
  el.classList.toggle("loading", Boolean(isLoading));
}

function fillProfileForm(data) {
  const form = document.getElementById("staffProfileForm");
  if (!form || !data) return;

  form.fullName.value = data.fullName || "";
  form.title.value = data.title || "";
  form.role.value = data.role || "";
  form.dobDay.value = data.dobDay || "";
  form.dobMonth.value = data.dobMonth || "";
  document.getElementById("avatarUrl").value = data.avatarUrl || "";
}

async function saveProfile(form) {
  const token = getStaffToken();
  if (!token || !form) return;

  const statusEl = document.getElementById("profileStatus");
  const payload = {
    fullName: form.fullName.value.trim(),
    title: form.title.value.trim(),
    role: form.role.value.trim(),
    dobDay: form.dobDay.value,
    dobMonth: form.dobMonth.value,
    avatarUrl: document.getElementById("avatarUrl").value.trim()
  };

  if (!payload.fullName || !payload.title || !payload.role || !payload.dobDay || !payload.dobMonth) {
    setStatus(statusEl, "All profile fields are required.", "error");
    return;
  }

  setStatus(statusEl, "Saving profile...", "loading");

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.status === 401) {
      throw new Error("Unauthorized staff session");
    }
    if (!res.ok || !data?.success) {
      setStatus(statusEl, data.message || "Failed to save profile", "error");
      return;
    }
    setStatus(statusEl, "Profile saved.", "success");
    loadDashboardStats();
  } catch (err) {
    handleSessionError(err);
  }
}

function renderAnnouncements(listEl, items) {
  if (!listEl) return;
  listEl.innerHTML = "";
  if (!items || items.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No announcements yet.";
    listEl.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "dashboard-card";

    const title = document.createElement("h4");
    title.textContent = item.title || "Untitled";

    const body = document.createElement("p");
    body.textContent = item.body || "";

    const meta = document.createElement("small");
    meta.textContent = item.createdAt
      ? new Date(item.createdAt).toLocaleString()
      : "";

    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(meta);
    listEl.appendChild(card);
  });
}

async function loadAnnouncements() {
  const token = getStaffToken();
  if (!token) return;

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/announcements", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      throw new Error("Unauthorized staff session");
    }
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error("Failed to load announcements");
    }
    renderAnnouncements(document.getElementById("announcementList"), data.data);
  } catch (err) {
    handleSessionError(err);
  }
}

async function loadMockSummary() {
  const token = getStaffToken();
  if (!token) return;
  const container = document.getElementById("staffMockSummary");
  if (!container) return;

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/mocks/summary", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      throw new Error("Unauthorized staff session");
    }
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error("Failed to load mock summary");
    }

    const items = data.data || [];
    if (!items.length) {
      container.innerHTML = "<p>No mocks uploaded yet.</p>";
      return;
    }

    container.innerHTML = items
      .map(
        (item) => `
      <div class="dashboard-card">
        <h3>${item.title || "Mock Exam"}</h3>
        <p><strong>Course:</strong> ${item.courseCode || "â€”"}</p>
        <p><strong>Attempts:</strong> ${item.attempts}</p>
        <p><strong>Average Score:</strong> ${item.averageScore}%</p>
      </div>`
      )
      .join("");
  } catch (err) {
    handleSessionError(err);
  }
}

async function submitAnnouncement(form) {
  const token = getStaffToken();
  if (!token || !form) return;

  const statusEl = document.getElementById("announcementStatus");
  const title = form.title.value.trim();
  const body = form.body.value.trim();

  if (!title || !body) {
    setStatus(statusEl, "Title and body are required.", "error");
    return;
  }

  setStatus(statusEl, "Creating announcement...", "loading");

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/announcements", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: (() => {
        const data = new FormData(form);
        data.set("title", title);
        data.set("body", body);
        return data;
      })()
    });
    const data = await res.json();
    if (res.status === 401) {
      throw new Error("Unauthorized staff session");
    }
    if (!res.ok || !data?.success) {
      setStatus(statusEl, data.message || "Failed to create announcement", "error");
      return;
    }
    setStatus(statusEl, "Announcement created.", "success");
    form.reset();
    loadAnnouncements();
  } catch (err) {
    handleSessionError(err);
  }
}

async function loadDashboardStats() {
  const token = getStaffToken();
  if (!token) {
    throw new Error("Missing staff token");
  }

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      throw new Error("Unauthorized staff session");
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error("Failed to load dashboard");
    }

    const name = [data.title, data.fullName].filter(Boolean).join(" ");
    document.getElementById("staffName").textContent = name || "â€”";
    document.getElementById("staffRole").textContent = data.role || "â€”";
    document.getElementById("statMaterials").textContent =
      data.stats?.materialsUploaded ?? 0;
    document.getElementById("statMocks").textContent =
      data.stats?.mocksUploaded ?? 0;
    document.getElementById("statCbt").textContent =
      data.stats?.cbtUploaded ?? 0;
  } catch (err) {
    handleSessionError(err);
  }
}

async function loadNotifications() {
  try {
    if (typeof fetchNotifications !== "function") return;
    const dropdown = document.getElementById("notificationDropdown");
    const badge = document.getElementById("notificationBadge");
    if (!dropdown || !badge) return;
    const notifications = await fetchNotifications();
    const sorted = notifications.sort((a, b) => Number(a.isRead) - Number(b.isRead));
    if (typeof renderNotifications === "function") {
      renderNotifications(dropdown, sorted);
    }
    if (typeof updateBadge === "function") {
      updateBadge(badge, notifications);
    }
  } catch (err) {
    handleSessionError(err);
  }
}

async function loadDashboard(meData) {
  fillProfileForm(meData);
  await loadDashboardStats();
  await loadMockSummary();
}

async function submitForm({
  form,
  endpoint,
  statusEl,
  progressEl,
  successMessage
}) {
  if (!form) return;

  const submitBtn = form.querySelector("button[type=\"submit\"]");
  const token = getStaffToken();
  const data = new FormData(form);

  const originalLabel = submitBtn ? submitBtn.textContent : "Submit";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";
  }
  setStatus(statusEl, "Uploading...", "loading");
  toggleProgress(progressEl, true);

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + `${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: data
    });

    const payload = await res.json();
    if (res.status === 401) {
      throw new Error("Unauthorized staff session");
    }
    if (!res.ok) {
      setStatus(statusEl, payload.message || "Upload failed", "error");
      return;
    }

    const message =
      typeof successMessage === "function"
        ? successMessage(payload)
        : successMessage;

    setStatus(statusEl, message || "Upload complete", "success");
    form.reset();
    loadDashboardStats();
  } catch (err) {
    handleSessionError(err);
  } finally {
    toggleProgress(progressEl, false);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = getStaffToken();
  if (!token) {
    window.location.href = "./staff-login.html";
    return;
  }

  setLoaderState("Loading your dashboard...");
  loaderTimeoutId = setTimeout(() => {
    setLoaderState("Unable to load dashboard. Please refresh.", true);
  }, 5000);

  try {
    const me = await fetchStaffMe();
    clearTimeout(loaderTimeoutId);
    showDashboard();

    await loadDashboard(me);
    await loadAnnouncements();
    await loadNotifications();
  } catch (err) {
    handleSessionError(err);
    return;
  }

  const materialsForm = document.getElementById("materialsForm");
  const mocksForm = document.getElementById("mocksForm");
  const cbtForm = document.getElementById("cbtForm");
  const profileForm = document.getElementById("staffProfileForm");
  const announcementForm = document.getElementById("announcementForm");
  const avatarFile = document.getElementById("avatarFile");

  avatarFile?.addEventListener("change", () => {
    const file = avatarFile.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById("avatarUrl").value = reader.result || "";
    };
    reader.readAsDataURL(file);
  });

  profileForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveProfile(profileForm);
  });

  materialsForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitForm({
      form: materialsForm,
      endpoint: "/api/staff/materials",
      statusEl: document.getElementById("materialsStatus"),
      progressEl: document.getElementById("materialsProgress"),
      successMessage: "Materials uploaded successfully."
    });
  });

  mocksForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitForm({
      form: mocksForm,
      endpoint: "/api/staff/mocks",
      statusEl: document.getElementById("mocksStatus"),
      progressEl: document.getElementById("mocksProgress"),
      successMessage: "Mock exams uploaded successfully."
    });
  });

  cbtForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitForm({
      form: cbtForm,
      endpoint: "/api/staff/cbt/convert",
      statusEl: document.getElementById("cbtStatus"),
      progressEl: document.getElementById("cbtProgress"),
      successMessage: (payload) =>
        `CBT created for ${payload.courseCode} with ${payload.totalQuestions} questions.`
    });
  });

  announcementForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitAnnouncement(announcementForm);
  });
});

