document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.ISA_API_BASE || (window.ISA_API_ORIGIN || "") + "/api";

  const form = document.getElementById("adminLoginForm");
  const msg = document.getElementById("msg");
  const warning = document.getElementById("tokenWarning");

  const hadStudentToken = Boolean(localStorage.getItem("studentToken"));
  // Admin entry should not carry a student session token.
  localStorage.removeItem("studentToken");

  const studentToken = hadStudentToken;
  if (studentToken && warning) {
    warning.textContent = "Student session cleared for admin login.";
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
