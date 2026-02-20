document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    window.location.href = "/pages/staff-login.html";
  });
});
