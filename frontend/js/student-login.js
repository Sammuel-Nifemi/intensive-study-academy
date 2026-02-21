// ===============================
// STUDENT LOGIN PAGE (MAGIC LOGIN)
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studentLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
      alert("Please enter your email");
      return;
    }

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/auth/quick-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data);

      if (!data.token) {
        alert(data.message || "Login failed");
        return;
      }

      // ✅ store token
      localStorage.setItem("studentToken", data.token);

      // 🚀 redirect
      window.location.href = "/pages/student-dashboard.html";

    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  });
});

