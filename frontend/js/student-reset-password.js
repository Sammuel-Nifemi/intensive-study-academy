document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studentResetPasswordForm");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPasswordBtn");

  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const token = String(params.get("token") || "").trim();

  if (!token) {
    alert("Invalid reset link.");
    window.location.href = "/frontend/pages/student-login.html";
    return;
  }

  const setVisibility = (input, btn) => {
    if (!input || !btn) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "Hide" : "Show";
  };

  togglePasswordBtn?.addEventListener("click", () => setVisibility(passwordInput, togglePasswordBtn));
  toggleConfirmPasswordBtn?.addEventListener("click", () => setVisibility(confirmPasswordInput, toggleConfirmPasswordBtn));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = String(passwordInput?.value || "");
    const confirmPassword = String(confirmPasswordInput?.value || "");

    if (!password || !confirmPassword) {
      alert("Please enter both password fields.");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Resetting...";
    }

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/students/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Password reset failed.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Reset Password";
        }
        return;
      }

      alert("Password reset successful. Please login.");
      window.location.href = "/frontend/pages/student-login.html";
    } catch (err) {
      console.error(err);
      alert("Unable to reset password right now.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Reset Password";
      }
    }
  });
});
