document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studentLoginForm");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const statusEl = document.createElement("p");
  statusEl.className = "auth-note";
  form.appendChild(statusEl);

  let isSubmitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = document.getElementById("email").value.trim();
    const password = passwordInput?.value || "";

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in...";
    }
    statusEl.textContent = "Signing in...";

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/students/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Login failed.");
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Login";
        }
        return;
      }

      statusEl.textContent = "Login successful. Redirecting...";

      if (!data.token) {
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Login";
        }
        return;
      }

      localStorage.setItem("studentToken", data.token);

      let goToCompleteProfile = null;
      if (typeof data.onboardingCompleted === "boolean") {
        goToCompleteProfile = data.onboardingCompleted === false;
      } else if (typeof data.profileCompleted === "boolean") {
        goToCompleteProfile = data.profileCompleted === false;
      }

      if (goToCompleteProfile === null) {
        try {
          const profileRes = await fetch((window.ISA_API_ORIGIN || "") + "/api/student/me", {
            headers: { Authorization: `Bearer ${data.token}` }
          });
          const profileData = await profileRes.json().catch(() => ({}));
          if (profileRes.ok) {
            goToCompleteProfile = profileData?.profileCompleted === false;
          }
        } catch (_) {
          // Keep fallback behavior below if profile check fails.
        }
      }

      const redirectUrl = goToCompleteProfile
        ? "/frontend/pages/complete-profile.html"
        : "/frontend/pages/student-dashboard.html";
      window.location.replace(redirectUrl);
    } catch (err) {
      console.error(err);
      alert("Network error.");
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    }
  });

  togglePasswordBtn?.addEventListener("click", () => {
    if (!passwordInput) return;
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    togglePasswordBtn.textContent = show ? "Hide" : "Show";
  });

  forgotPasswordBtn?.addEventListener("click", async () => {
    const email = document.getElementById("email")?.value.trim();
    if (!email) {
      alert("Enter your email first.");
      return;
    }

    forgotPasswordBtn.disabled = true;
    forgotPasswordBtn.textContent = "Sending reset link...";
    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/students/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      alert(data.message || "If the email exists, a reset link has been sent.");
    } catch (err) {
      console.error(err);
      alert("Unable to send reset link right now.");
    } finally {
      forgotPasswordBtn.disabled = false;
      forgotPasswordBtn.textContent = "Forgot password?";
    }
  });
});
