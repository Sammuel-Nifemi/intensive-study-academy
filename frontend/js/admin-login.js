document.addEventListener("DOMContentLoaded", () => {
  const isProductionHost =
    window.location.hostname === "intensivestudyacademy.com" ||
    window.location.hostname === "www.intensivestudyacademy.com";
  const API_BASE = isProductionHost
    ? "https://intensive-study-backend.onrender.com/api"
    : "http://localhost:5000/api";

  const form = document.getElementById("adminLoginForm");
  const msg = document.getElementById("msg");
  const warning = document.getElementById("tokenWarning");

  const studentToken = localStorage.getItem("studentToken");
  if (studentToken && warning) {
    warning.textContent =
      "Student session detected. Please use Student Login or log out first.";
    warning.style.display = "block";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const submitBtn = form.querySelector("button[type=\"submit\"]");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in...";
    }

    msg.textContent = "Logging in...";

    try {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        msg.textContent = data.message || "Login failed";
        return;
      }

      // ✅ Save admin auth (separate from staff)
      localStorage.setItem("adminToken", data.token);

      // 🚀 Redirect
      window.location.href = "./admin-dashboard.html";

    } catch (err) {
      console.error(err);
      msg.textContent = "Server error. Try again.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    }
  });
});
