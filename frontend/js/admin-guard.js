const adminToken = (localStorage.getItem("adminToken") || localStorage.getItem("token"));
window.NOTIFICATION_TOKEN = adminToken;

if (!adminToken) {
  window.location.href = "./admin-login.html";
}

