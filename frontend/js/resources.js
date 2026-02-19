document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("studentToken");

  if (token) {
    // User is logged in → unlock everything
    document.querySelectorAll(".resource-item.locked").forEach(item => {
      item.classList.remove("locked");

      // Optional: change badge text
      const badge = item.querySelector(".badge");
      if (badge) badge.textContent = "Open";

      // Optional: point to real pages later
    });
  }
});
item.addEventListener("click", (e) => {
  const token = localStorage.getItem("studentToken");

  if (!token) {
    // window.location.href = "/frontend/pages/student-login.html";
  } else {
    // Later: route to actual resource
    console.log("Open resource:", item.dataset.target);
  }
});


