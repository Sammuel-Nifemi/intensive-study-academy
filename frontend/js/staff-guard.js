const staffToken = localStorage.getItem("staffToken");
window.NOTIFICATION_TOKEN = staffToken;

function showLoader() {
  const loader = document.getElementById("staffLoader");
  const app = document.getElementById("staffApp");
  if (loader) loader.style.display = "flex";
  if (app) app.style.display = "none";
}

function showApp() {
  const loader = document.getElementById("staffLoader");
  const app = document.getElementById("staffApp");
  if (loader) loader.style.display = "none";
  if (app) app.style.display = "block";
}

async function guardStaff() {
  if (!staffToken) {
    window.location.href = "/pages/staff-login.html";
    return;
  }

  showLoader();

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/me", {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const data = await res.json();

    if (!res.ok) {
      window.location.href = "/pages/staff-login.html";
      return;
    }

    // No profile completion gating. Always allow staff pages.
    showApp();
  } catch (err) {
    window.location.href = "/pages/staff-login.html";
  }
}

document.addEventListener("DOMContentLoaded", guardStaff);
