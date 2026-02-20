
(function authOnly() {
  const token = localStorage.getItem("studentToken");
  window.NOTIFICATION_TOKEN = token;

  if (!token) {
    window.location.href = "/frontend/pages/student-login.html";
  }
})();

