// ===============================
// STUDENT LOGIN PAGE (MAGIC LOGIN)
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studentLoginForm");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.createElement("p");
  statusEl.className = "auth-note";
  form.appendChild(statusEl);

  let isSubmitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = document.getElementById("email").value.trim();

    if (!email) {
      alert("Please enter your email");
      return;
    }

    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending login link…";
    }
    statusEl.textContent = "";

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/auth/quick-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Login failed");
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Login";
        }
        return;
      }

      statusEl.textContent = "Check your email for your dashboard link.";

      if (!data.token) {
        return;
      }

      localStorage.setItem("studentToken", data.token);

      setTimeout(() => {
        window.location.href = "/pages/student-dashboard.html";
      }, 900);
    } catch (err) {
      console.error(err);
      alert("Network error");
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    }
  });
});
