const adminToken = localStorage.getItem("adminToken");
window.NOTIFICATION_TOKEN = adminToken;

if (!adminToken) {
  window.location.href = "./admin-login.html";
}
