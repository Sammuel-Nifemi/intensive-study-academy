// ================= ACADEMIC RESOURCE CENTER LOGIC =================

// Get form elements
const signInForm = document.getElementById("arcSignInForm");
const matricInput = document.getElementById("matricNumber");
const phoneInput = document.getElementById("phoneNumber");
const emailInput = document.getElementById("emailAddress");

// Handle sign in
signInForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const matric = matricInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();

  // Basic validation
  if (!matric || !phone || !email) {
    alert("Please fill in all required fields.");
    return;
  }

  // 1️⃣ Create session token (temporary)
  localStorage.setItem("studentToken", "student-session-active");

  // 2️⃣ Save basic identity (non-destructive)
  localStorage.setItem(
    "studentIdentity",
    JSON.stringify({
      matric,
      phone,
      email,
    })
  );

  // 3️⃣ Decision point: profile exists?
  const profile = localStorage.getItem("studentProfile");

  if (profile) {
    // Returning student → dashboard
    window.location.href = "/pages/student-dashboard.html";
  } else {
    // First-time student → setup
    window.location.href = "student-setup.html";
  }
});

