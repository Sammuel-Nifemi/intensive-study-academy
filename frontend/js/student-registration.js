document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studentRegisterForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const fullName = document.getElementById("fullName").value.trim();

    if (!email) {
      alert("Email is required");
      return;
    }

    const payload = { email };
    if (fullName) payload.fullName = fullName;

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/students/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      const success = document.getElementById("registerSuccess");
      if (success) success.hidden = false;
      form.reset();
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });

  document.getElementById("openEmailBtn")?.addEventListener("click", () => {
    window.location.href = "mailto:";
  });

  document.getElementById("resendLinkBtn")?.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    if (!email) {
      alert("Enter your email to resend the link.");
      return;
    }
    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to resend login link");
        return;
      }
      alert("Login link sent. Please check your email.");
    } catch (err) {
      console.error(err);
      alert("Failed to resend login link");
    }
  });
});
