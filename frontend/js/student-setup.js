


// ================= STUDENT SETUP LOGIC =================

// -------- PROGRAM → FACULTY MAP (Admin-controlled later) --------
const programFacultyMap = {
  "Computer Science": "Faculty of Computing",
  "Biology": "Faculty of Science",
  "Economics": "Faculty of Social Sciences"
};

// -------- COURSE CATALOG (Admin-controlled later) --------
const courseCatalog = {
  "Computer Science": {
    "100": ["CSC101", "CSC102"],
    "200": ["CSC201", "CSC202"]
  },
  "Biology": {
    "100": ["BIO101", "BIO102"],
    "200": ["BIO201", "BIO202"]
  },
  "Economics": {
    "100": ["ECO101", "ECO102"],
    "200": ["ECO201", "ECO202"]
  }
};

// -------- DOM ELEMENTS --------
const programSelect = document.getElementById("program");
const facultyInput = document.getElementById("faculty");
const levelSelect = document.getElementById("level");
const semesterSelect = document.getElementById("semester");
const coursesSelect = document.getElementById("courses");

const stateSelect = document.getElementById("state");
const studyCenterSelect = document.getElementById("studyCenter");

const setupForm = document.getElementById("studentSetupForm");

// -------- LOAD STUDY CENTERS FROM ADMIN --------
const studyCenters =
  JSON.parse(localStorage.getItem("studyCenters")) || {};

// Populate study centers when state changes
stateSelect.addEventListener("change", () => {
  studyCenterSelect.innerHTML =
    '<option value="">Select Study Center</option>';

  const centers = studyCenters[stateSelect.value] || [];

  centers.forEach(center => {
    const option = document.createElement("option");
    option.value = center;
    option.textContent = center;
    studyCenterSelect.appendChild(option);
  });
});

// -------- AUTO-FILL FACULTY --------
programSelect.addEventListener("change", () => {
  facultyInput.value = programFacultyMap[programSelect.value] || "";
  loadCourses();
});

// Reload courses when level changes
levelSelect.addEventListener("change", loadCourses);

function loadCourses() {
  coursesSelect.innerHTML = "";

  const program = programSelect.value;
  const level = levelSelect.value;

  if (!program || !level) return;

  const courses = courseCatalog[program]?.[level] || [];

  courses.forEach(course => {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = course;
    coursesSelect.appendChild(option);
  });
}

// -------- SAVE STUDENT PROFILE --------
setupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!stateSelect.value || !studyCenterSelect.value) {
    alert("Please select your state and study center.");
    return;
  }

  const profile = {
    program: programSelect.value,
    faculty: facultyInput.value,
    level: levelSelect.value,
    semester: semesterSelect.value,
    state: stateSelect.value,
    studyCenter: studyCenterSelect.value,
    courses: Array.from(coursesSelect.selectedOptions).map(o => o.value)
  };

  const token = localStorage.getItem("studentToken");

  if (!token) {
    alert("Session expired. Please login again.");
    // window.location.href = "student-login.html";
    return;
  }

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/student/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profile)
    });

    if (!res.ok) throw new Error();

    // optional: cache for frontend use
    localStorage.setItem("studentProfile", JSON.stringify(profile));

window.location.href = "/pages/student-dashboard.html";
  } catch (err) {
    alert("Unable to complete setup. Please try again.");
  }
});


