function readRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(String(token || "").split(".")[1] || ""));
    return payload?.role || "";
  } catch {
    return "";
  }
}

const sessionToken =
  localStorage.getItem("adminToken") ||
  localStorage.getItem("staffToken") ||
  localStorage.getItem("token");

if (!sessionToken) {
  window.location.href = "./admin-login.html";
}

const roleFromToken = readRoleFromToken(sessionToken);
const savedRole = localStorage.getItem("role") || roleFromToken;
const role = savedRole || roleFromToken;

if (!["admin", "staff"].includes(role)) {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("staffToken");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "./admin-login.html";
}

localStorage.setItem("role", role);
localStorage.setItem("token", sessionToken);
if (role === "staff") {
  localStorage.setItem("staffToken", sessionToken);
} else {
  localStorage.setItem("adminToken", sessionToken);
}

window.NOTIFICATION_TOKEN = sessionToken;
window.ISA_USER_ROLE = role;
window.ISA_IS_STAFF = role === "staff";

const badgeHost =
  document.querySelector(".dashboard-header .user-text") ||
  document.querySelector(".dashboard-header .header-container") ||
  document.querySelector(".dashboard-header");

if (badgeHost && !document.getElementById("staffModeBadge")) {
  const badge = document.createElement("span");
  badge.id = "staffModeBadge";
  badge.textContent = "STAFF MODE";
  badge.style.display = "none";
  badge.style.marginLeft = "10px";
  badge.style.padding = "4px 8px";
  badge.style.background = "#f59e0b";
  badge.style.color = "white";
  badge.style.borderRadius = "6px";
  badge.style.fontSize = "12px";
  badgeHost.appendChild(badge);
}

if (role === "staff") {
  const badge = document.getElementById("staffModeBadge");
  if (badge) {
    badge.style.display = "inline-block";
  }

  const restrictedPages = ["admin-settings.html", "admin-staff.html"];
  const currentPage = String(window.location.pathname || "").split("/").pop();
  if (restrictedPages.includes(currentPage)) {
    window.location.href = "./admin-dashboard.html";
  }

  const style = document.createElement("style");
  style.textContent = [
    "a[href*='admin-settings.html'],",
    "a[href*='admin-staff.html'],",
    ".action-btn.danger,",
    "[data-delete] { display: none !important; }"
  ].join("\n");
  document.head.appendChild(style);
}

