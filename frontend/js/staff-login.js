document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("staffLoginForm");
  const otpForm = document.getElementById("staffOtpForm");
  const resetForm = document.getElementById("staffResetForm");
  const forgotBtn = document.getElementById("forgotBtn");

  const msg = document.getElementById("msg");
  const otpMsg = document.getElementById("otpMsg");
  const resetMsg = document.getElementById("resetMsg");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const otpInput = document.getElementById("otpCode");
  const newPasswordInput = document.getElementById("newPassword");
  const toggleNewPassword = document.getElementById("toggleNewPassword");

  const togglePassword = document.getElementById("togglePassword");
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    });
  }
  if (toggleNewPassword && newPasswordInput) {
    toggleNewPassword.addEventListener("click", () => {
      newPasswordInput.type = newPasswordInput.type === "password" ? "text" : "password";
    });
  }

  const setMessage = (el, message) => {
    if (!el) return;
    el.textContent = message || "";
  };

  const showSection = (section) => {
    if (loginForm) loginForm.style.display = section === "login" ? "block" : "none";
    if (otpForm) otpForm.style.display = section === "otp" ? "block" : "none";
    if (resetForm) resetForm.style.display = section === "reset" ? "block" : "none";
  };

  const clearMessages = () => {
    setMessage(msg, "");
    setMessage(otpMsg, "");
    setMessage(resetMsg, "");
  };

  const loginStaff = async () => {
    clearMessages();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    setMessage(msg, "Logging in...");

    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/auth/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(msg, data.message || "Login failed");
      return;
    }

    if (data.otpRequired) {
      setMessage(msg, "OTP verification required.");
      showSection("otp");
      return;
    }

    localStorage.setItem("staffToken", data.token);
    await redirectAfterProfileCheck();
  };

  const verifyOtp = async () => {
    clearMessages();
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();

    if (!email) {
      setMessage(otpMsg, "Email is required.");
      return;
    }

    setMessage(otpMsg, "Verifying OTP...");

    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/auth/staff/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(otpMsg, data.message || "OTP verification failed");
      return;
    }

    setMessage(otpMsg, "OTP verified. Set a new password.");
    showSection("reset");
  };

  const resetPassword = async () => {
    clearMessages();
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    const newPassword = newPasswordInput.value;

    if (!email || !otp) {
      setMessage(resetMsg, "Email and OTP are required.");
      return;
    }

    setMessage(resetMsg, "Updating password...");

    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/auth/staff/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(resetMsg, data.message || "Password reset failed");
      return;
    }

    localStorage.setItem("staffToken", data.token);
    await redirectAfterProfileCheck();
  };

  const forgotPassword = async () => {
    clearMessages();
    const email = emailInput.value.trim();
    if (!email) {
      setMessage(msg, "Enter your email first.");
      return;
    }

    setMessage(msg, "Sending OTP...");

    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/auth/staff/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(msg, data.message || "Failed to send OTP");
      return;
    }

    setMessage(msg, "OTP sent. Check your email.");
    showSection("otp");
  };

  const redirectAfterProfileCheck = async () => {
    const token = localStorage.getItem("staffToken");
    if (!token) {
      window.location.href = "./staff-login.html";
      return;
    }

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        window.location.href = "./staff-login.html";
        return;
      }
      if (!data.profileCompleted) {
        window.location.href = "./staff-profile.html";
      } else {
        window.location.href = "./staff-dashboard.html";
      }
    } catch (err) {
      window.location.href = "./staff-login.html";
    }
  };

  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    loginStaff().catch((err) => {
      console.error(err);
      setMessage(msg, "Login failed.");
    });
  });

  otpForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    verifyOtp().catch((err) => {
      console.error(err);
      setMessage(otpMsg, "OTP verification failed.");
    });
  });

  resetForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    resetPassword().catch((err) => {
      console.error(err);
      setMessage(resetMsg, "Password reset failed.");
    });
  });

  forgotBtn?.addEventListener("click", () => {
    forgotPassword().catch((err) => {
      console.error(err);
      setMessage(msg, "Failed to send OTP.");
    });
  });
});

