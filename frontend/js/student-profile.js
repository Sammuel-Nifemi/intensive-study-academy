const STUDENT_LOGIN_URL = "/frontend/pages/student-login.html";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("studentToken");
  if (!token) {
    window.location.href = STUDENT_LOGIN_URL;
    return;
  }

  applyTheme();
  setText("profileName", "Loading...");
  setText("profileTitle", "-");
  setText("profilePhone", "-");
  setText("profileStudyCenter", "-");
  setText("profileFaculty", "-");
  setText("profileProgram", "-");
  setText("profileLevel", "-");
  setText("profileSemester", "-");

  try {
    const cached = window.readStudentCache ? window.readStudentCache() : null;
    if (cached) {
      renderProfile(cached);
      if (window.hydrateStudentHeader) window.hydrateStudentHeader(cached);
    }

    const profile = window.loadStudent ? await window.loadStudent({ force: true }) : null;
    if (!profile) {
      if (!cached) setText("profileName", "Student");
      return;
    }

    renderProfile(profile);
    if (window.hydrateStudentHeader) window.hydrateStudentHeader(profile);
  } catch (err) {
    console.error("Profile load error:", err);
  }

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentProfileCache");
    localStorage.removeItem("studentProfileCacheToken");
    window.location.href = STUDENT_LOGIN_URL;
  });
});

function applyTheme() {
  const theme = localStorage.getItem("theme") || "classic";
  document.body.setAttribute("data-theme", theme);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "-";
}

function renderProfile(profile) {
  setText("profileName", profile?.fullName || profile?.name);
  setText("profileTitle", profile?.title);
  setText("profilePhone", profile?.phone || profile?.phoneNumber);

  setText(
    "profileStudyCenter",
    profile?.studyCenter || profile?.studyCenterName || profile?.center
  );
  setText("profileFaculty", profile?.faculty || profile?.facultyName);
  setText("profileProgram", profile?.program || profile?.programName);
  setText("profileLevel", profile?.level);
  setText("profileSemester", profile?.semester);
}
