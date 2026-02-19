document.getElementById("accessForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const matricInput = document.getElementById("matric").value.trim();
  const programme = document.getElementById("programme").value;
  const level = document.getElementById("level").value;
  const error = document.getElementById("error");

  // Normalize matric number
  const matric = matricInput.toUpperCase();

  if (!matric.startsWith("NOU")) {
    error.textContent = "Invalid NOUN matric number.";
    return;
  }

  // Save student session (Netlify-safe)
  const student = {
    matric,
    programme,
    level
  };

  sessionStorage.setItem("studentSession", JSON.stringify(student));

  // Redirect to dashboard
  window.location.href = "dashboard.html";
});
