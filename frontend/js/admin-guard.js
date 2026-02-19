const adminToken = localStorage.getItem("adminToken");
window.NOTIFICATION_TOKEN = adminToken;

if (!adminToken) {
  window.location.href = "/frontend/pages/admin-login.html";
}
