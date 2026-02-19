
/* =====================================================
   STAFF MATERIALS MANAGER
===================================================== */

// AUTH GUARD
const token = localStorage.getItem("staffToken");
const staffProfile = JSON.parse(localStorage.getItem("staffProfile"));

if (!token || !staffProfile) {
  window.location.href = "staff-login.html";
}

// DOM
const courseSelect = document.getElementById("courseSelect");
const uploadBtn = document.getElementById("uploadBtn");
const materialTitle = document.getElementById("materialTitle");
const materialFile = document.getElementById("materialFile");
const materialList = document.getElementById("materialList");
const uploadMessage = document.getElementById("uploadMessage");

// DATA
const courses = JSON.parse(localStorage.getItem("courses")) || [];
const assignments =
  JSON.parse(localStorage.getItem("staffAssignments")) || [];

let materials =
  JSON.parse(localStorage.getItem("staffMaterials")) || [];

/* ================= LOAD ASSIGNED COURSES ================= */
const assignment = assignments.find(
  a => a.email === staffProfile.email
);

if (assignment) {
  const assignedCourses = courses.filter(c =>
    assignment.courseIds.includes(c.id)
  );

  assignedCourses.forEach(course => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.code} – ${course.title}`;
    courseSelect.appendChild(option);
  });
}

/* ================= UPLOAD MATERIAL ================= */
uploadBtn.addEventListener("click", () => {
  const courseId = Number(courseSelect.value);
  const title = materialTitle.value.trim();
  const file = materialFile.files[0];

  if (!courseId || !title || !file) {
    alert("Select course, enter title, and choose a file.");
    return;
  }

  materials.push({
    id: Date.now(),
    staffEmail: staffProfile.email,
    courseId,
    title,
    fileName: file.name,
    uploadedAt: new Date().toISOString()
  });

  localStorage.setItem("staffMaterials", JSON.stringify(materials));

  materialTitle.value = "";
  materialFile.value = "";

  uploadMessage.textContent = "Material uploaded successfully.";
  renderMaterials(courseId);
});

/* ================= RENDER MATERIALS ================= */
courseSelect.addEventListener("change", () => {
  renderMaterials(Number(courseSelect.value));
});

function renderMaterials(courseId) {
  materialList.innerHTML = "";

  const filtered = materials.filter(
    m =>
      m.courseId === courseId &&
      m.staffEmail === staffProfile.email
  );

  if (!filtered.length) {
    materialList.innerHTML = "<li>No materials uploaded yet.</li>";
    return;
  }

  filtered.forEach(m => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${m.title}</strong>
      <span>${m.fileName}</span>
      <button data-id="${m.id}" class="delete-btn">Delete</button>
    `;
    materialList.appendChild(li);
  });
}

/* ================= DELETE ================= */
materialList.addEventListener("click", e => {
  if (!e.target.classList.contains("delete-btn")) return;

  const id = Number(e.target.dataset.id);
  materials = materials.filter(m => m.id !== id);
  localStorage.setItem("staffMaterials", JSON.stringify(materials));

  renderMaterials(Number(courseSelect.value));
});

/* ================= LOGOUT ================= */
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("staffToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("role");
  localStorage.removeItem("staffProfile");
  window.location.href = "staff-login.html";
});
