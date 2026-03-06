document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studentRegisterForm");
  const successCard = document.getElementById("registerSuccess");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPasswordBtn");

  if (!form) return;

  const setPasswordVisibility = (input, btn) => {
    if (!input || !btn) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "Hide" : "Show";
  };

  togglePasswordBtn?.addEventListener("click", () => {
    setPasswordVisibility(passwordInput, togglePasswordBtn);
  });

  toggleConfirmPasswordBtn?.addEventListener("click", () => {
    setPasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const fullName = document.getElementById("fullName")?.value.trim();
    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";

    if (!email || !password || !confirmPassword) {
      alert("Email and password fields are required.");
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

    const payload = { email, password, confirmPassword };
    if (fullName) payload.fullName = fullName;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account...";
    }

    try {
      const endpoint =
        (window.ISA_API_ORIGIN || "") +
        "/api/students/register" +
        (referralCode ? `?ref=${encodeURIComponent(referralCode)}` : "");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Registration failed");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Create Account";
        }
        return;
      }

      if (data.token) {
        localStorage.setItem("studentToken", data.token);
      }

      if (successCard) successCard.hidden = false;
      form.reset();

      setTimeout(() => {
        window.location.href = "/frontend/pages/complete-profile.html";
      }, 800);
    } catch (err) {
      console.error(err);
      alert("Server error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
      }
    }
  });
});
  const referralCode = String(new URLSearchParams(window.location.search).get("ref") || "").trim();
