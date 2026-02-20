const staffToken = localStorage.getItem("staffToken");
if (!staffToken) {
  window.location.href = "/pages/staff-login.html";
}

function setStatus(id, message, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("error", "success", "loading");
  if (type) el.classList.add(type);
}

async function loadSettings() {
  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/settings", {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const data = await res.json();
    if (!res.ok) {
      if (data && data.redirectTo) {
        window.location.href = data.redirectTo;
        return;
      }
      window.location.href = "/pages/staff-login.html";
      return;
    }

    document.getElementById("emailNotifications").checked = Boolean(data.emailNotifications);
    document.getElementById("inAppNotifications").checked = Boolean(data.inAppNotifications);
    document.getElementById("darkMode").checked = Boolean(data.darkMode);
  } catch (err) {
    window.location.href = "/pages/staff-login.html";
  }
}

async function saveSettings(e) {
  e.preventDefault();
  setStatus("settingsStatus", "Saving...", "loading");

  const payload = {
    emailNotifications: document.getElementById("emailNotifications").checked,
    inAppNotifications: document.getElementById("inAppNotifications").checked,
    darkMode: document.getElementById("darkMode").checked
  };

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("settingsStatus", data.message || "Failed to save", "error");
      return;
    }
    setStatus("settingsStatus", "Settings saved.", "success");
  } catch (err) {
    setStatus("settingsStatus", "Failed to save.", "error");
  }
}

async function changePassword(e) {
  e.preventDefault();
  setStatus("passwordStatus", "Updating...", "loading");

  const payload = {
    currentPassword: document.getElementById("currentPassword").value,
    newPassword: document.getElementById("newPassword").value
  };

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("passwordStatus", data.message || "Failed to update", "error");
      return;
    }
    setStatus("passwordStatus", "Password updated.", "success");
    document.getElementById("passwordForm").reset();
  } catch (err) {
    setStatus("passwordStatus", "Failed to update.", "error");
  }
}

async function requestDeactivation() {
  setStatus("deactivateStatus", "Submitting request...", "loading");
  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/deactivate-request", {
      method: "POST",
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("deactivateStatus", data.message || "Failed to submit", "error");
      return;
    }
    setStatus("deactivateStatus", "Request submitted.", "success");
  } catch (err) {
    setStatus("deactivateStatus", "Failed to submit.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  document.getElementById("settingsForm").addEventListener("submit", saveSettings);
  document.getElementById("passwordForm").addEventListener("submit", changePassword);
  document.getElementById("deactivateBtn").addEventListener("click", requestDeactivation);
});
