document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.ISA_API_BASE || (window.ISA_API_ORIGIN || "") + "/api";

  const form = document.getElementById("adminLoginForm");
  const msg = document.getElementById("msg");
  const warning = document.getElementById("tokenWarning");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  if (togglePassword && passwordInput) {
    const syncToggleLabel = () => {
      const isHidden = passwordInput.type === "password";
      togglePassword.textContent = isHidden ? "Show" : "Hide";
      togglePassword.setAttribute("aria-label", isHidden ? "Show password" : "Hide password");
    };

    togglePassword.addEventListener("click", (event) => {
      event.preventDefault();
      passwordInput.type = passwordInput.type === "password" ? "text" : "password";
      syncToggleLabel();
    });

    syncToggleLabel();
  }

  const hadStudentToken = Boolean(localStorage.getItem("studentToken"));
  localStorage.removeItem("studentToken");

  if (hadStudentToken && warning) {
    warning.textContent = "Student session cleared for admin login.";
    warning.style.display = "block";
  }

  if (!form || !msg) {
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (/gmail\.co$/i.test(email)) {
      msg.textContent = "Email looks incomplete. Did you mean gmail.com?";
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401 && data?.message === "Admin account not found") {
          msg.textContent = "Admin email not found.";
          return;
        }

        if (res.status === 401 && data?.message === "Incorrect password") {
          msg.textContent = "Incorrect password.";
          return;
        }

        msg.textContent = data.message || "Login failed.";
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "admin");
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

