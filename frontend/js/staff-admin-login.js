document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("staffAdminLoginForm");
  const msg = document.getElementById("msg");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  const API_BASE = window.ISA_API_BASE || (window.ISA_API_ORIGIN || "") + "/api";

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const hidden = passwordInput.type === "password";
      passwordInput.type = hidden ? "text" : "password";
      togglePassword.textContent = hidden ? "Hide" : "Show";
    });
  }

  if (!form || !msg) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in...";
    }
    msg.textContent = "Logging in...";

    try {
      const res = await fetch(`${API_BASE}/auth/staff/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        msg.textContent = data.message || "Login failed.";
        return;
      }

      if (data.otpRequired) {
        msg.textContent = "OTP required. Continue via staff-login page.";
        return;
      }

      if (!data.token) {
        msg.textContent = "No session token received.";
        return;
      }

      localStorage.setItem("staffToken", data.token);
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "staff");
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
