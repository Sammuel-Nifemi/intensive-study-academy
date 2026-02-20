/* =====================================================
   ROLE GUARD
===================================================== */

const token = (localStorage.getItem("adminToken") || localStorage.getItem("token"));
window.NOTIFICATION_TOKEN = token;

if (!token) {
  window.location.href = "./admin-login.html";
}
 

