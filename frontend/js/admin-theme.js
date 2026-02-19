const ADMIN_THEMES = ["emerald", "slate", "royal", "sunset", "mono"];

function normalizeAdminTheme(theme) {
  if (ADMIN_THEMES.includes(theme)) return theme;
  if (theme === "light") return "emerald";
  if (theme === "dark") return "slate";
  if (theme === "purple") return "royal";
  return "emerald";
}

function applyAdminTheme(theme) {
  const stored = localStorage.getItem("adminTheme");
  const value = normalizeAdminTheme(theme || stored || "emerald");
  document.body.setAttribute("data-admin-theme", value);
}

document.addEventListener("DOMContentLoaded", () => {
  applyAdminTheme();
});

window.applyAdminTheme = applyAdminTheme;
window.normalizeAdminTheme = normalizeAdminTheme;
