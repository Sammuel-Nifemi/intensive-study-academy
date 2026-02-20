

document.addEventListener("DOMContentLoaded", () => {

  // ================= DOM ELEMENTS =================
  const registrationSection = document.getElementById("academicRegistrationSection");
  const confirmationSection = document.getElementById("confirmationSection");

  const registrationForm = document.getElementById("academicSetupForm");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const confirmAccessBtn = document.getElementById("confirmAccessBtn");

  if (!registrationForm) return;

  // ================= CHECK STORED DATA =================
  const academicProfile = JSON.parse(localStorage.getItem("academicProfile"));
  const studentSession = JSON.parse(localStorage.getItem("studentSession"));

  // ================= PAGE MODE DECISION =================

  // Returning student
  if (academicProfile && !studentSession) {
    registrationSection.style.display = "none";
    confirmationSection.style.display = "block";
  }

  // Active session
  if (academicProfile && studentSession) {
    window.location.href = "/frontend/pages/student-dashboard.html";
    return;
  }

  // First-time student
  if (!academicProfile) {
    registrationSection.style.display = "block";
    confirmationSection.style.display = "none";
  }

  // ================= REGISTRATION SUBMIT =================
  registrationForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const coursesSelect = document.getElementById("courses");
    const selectedCourses = coursesSelect
      ? Array.from(coursesSelect.selectedOptions).map(opt => opt.value)
      : [];

    const profile = {
      matricNumber: document.getElementById("matricNumber").value.trim().toLowerCase(),
      phone: document.getElementById("phone").value.trim(),
      faculty: document.getElementById("faculty").value,
      discipline: document.getElementById("discipline").value,
      level: document.getElementById("level").value,
      semester: document.getElementById("semester").value,
      studyCenter: document.getElementById("studyCenter").value,
      courses: selectedCourses,
      courseCount: selectedCourses.length,
      createdAt: Date.now()
    };

    localStorage.setItem("academicProfile", JSON.stringify(profile));

    registrationSection.style.display = "none";
    confirmationSection.style.display = "block";
  });

  // ================= CONFIRM ACCESS =================
  if (confirmAccessBtn) {
    confirmAccessBtn.addEventListener("click", () => {
      const enteredPassword = confirmPasswordInput.value.trim().toLowerCase();
      const freshProfile = JSON.parse(localStorage.getItem("academicProfile"));

      if (!freshProfile) {
        alert("Academic profile not found.");
        return;
      }

      if (enteredPassword !== freshProfile.matricNumber) {
        alert("Incorrect password. Use your matric number.");
        return;
      }

      const session = {
        matricNumber: freshProfile.matricNumber,
        role: "student",
        loggedInAt: Date.now()
      };

      localStorage.setItem("studentSession", JSON.stringify(session));
      window.location.href = "/frontend/pages/student-dashboard.html";
    });
  }

});

