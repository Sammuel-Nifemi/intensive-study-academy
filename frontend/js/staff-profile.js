// Profile = identity only (edit-only, no completion gating).
const staffToken = localStorage.getItem("staffToken");
if (!staffToken) {
  window.location.href = "/pages/staff-login.html";
}

function setStatus(message, type) {
  const el = document.getElementById("profileStatus");
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("error", "success", "loading");
  if (type) el.classList.add(type);
}

function setSaveState(isSaved) {
  const btn = document.querySelector("button[form=\"staffProfileForm\"]");
  if (!btn) return;
  if (isSaved) {
    btn.disabled = true;
    btn.textContent = "Saved";
  } else {
    btn.disabled = false;
    btn.textContent = "Save Profile";
  }
}

async function loadProfile() {
  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/me", {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const payload = await res.json();
    if (!res.ok || !payload?.success) {
      window.location.href = "/pages/staff-login.html";
      return;
    }
    const data = payload.data || {};
    document.getElementById("fullName").value = data.fullName || "";
    document.getElementById("title").value = data.title || "";
    document.getElementById("role").value = data.role || "";
    document.getElementById("dobDay").value = data.dobDay || "";
    document.getElementById("dobMonth").value = data.dobMonth || "";
    document.getElementById("avatarUrl").value = data.avatarUrl || "";
    setSaveState(false);
  } catch (err) {
    window.location.href = "/pages/staff-login.html";
  }
}

async function saveProfile(e) {
  e.preventDefault();
  setStatus("Saving profile...", "loading");

  const payload = {
    fullName: document.getElementById("fullName").value.trim(),
    title: document.getElementById("title").value,
    role: document.getElementById("role").value.trim(),
    dobDay: document.getElementById("dobDay").value,
    dobMonth: document.getElementById("dobMonth").value,
    avatarUrl: document.getElementById("avatarUrl").value.trim()
  };

  if (!payload.fullName || !payload.title || !payload.role || !payload.dobDay || !payload.dobMonth) {
    setStatus("All profile fields are required.", "error");
    setSaveState(false);
    return;
  }

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data?.success) {
      setStatus(data.message || "Failed to save profile", "error");
      setSaveState(false);
      return;
    }

    setStatus("Profile updated.", "success");
    setSaveState(true);
  } catch (err) {
    setStatus("Failed to save profile.", "error");
    setSaveState(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
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
  document.getElementById("staffProfileForm").addEventListener("submit", saveProfile);
  document
    .getElementById("staffProfileForm")
    .querySelectorAll("input, select")
    .forEach((el) => {
      el.addEventListener("input", () => setSaveState(false));
      el.addEventListener("change", () => setSaveState(false));
    });
});
