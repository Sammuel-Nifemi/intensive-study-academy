document.addEventListener("DOMContentLoaded", () => {
  const logoutButtons = document.querySelectorAll("#logoutBtn, #logoutBtnInline, .logout-btn");
  if (!logoutButtons.length) return;

  const doLogout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "/pages/student-login.html";
  };

  logoutButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      doLogout();
    });
  });
});

