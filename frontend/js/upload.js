/* =====================================================
   STAFF MATERIAL UPLOAD LOGIC
===================================================== */

/* ================= ROLE GUARD ================= */
const token = (localStorage.getItem("adminToken") || localStorage.getItem("token"));
if (!token) {
  window.location.href = "./admin-login.html";
}

/* ================= STORAGE ================= */
const courses =
  JSON.parse(localStorage.getItem("courses")) || [];

const materials =
  JSON.parse(localStorage.getItem("materials")) || [];

/* ================= DOM ================= */
const uploadForm = document.getElementById("uploadForm");
const courseSelect = document.getElementById("materialCourseSelect");
const materialTypeSelect = document.getElementById("materialType");
const materialTitleInput = document.getElementById("materialTitle");

/* ================= LOAD COURSES ================= */
function loadCourses() {
  if (!courseSelect) return;

  courseSelect.innerHTML = `<option value="">Select course</option>`;

  courses.forEach(course => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.code} – ${course.title}`;
    courseSelect.appendChild(option);
  });
}

loadCourses();

/* ================= UPLOAD MATERIAL ================= */
uploadForm?.addEventListener("submit", e => {
  e.preventDefault();

  const courseId = courseSelect.value;
  const type = materialTypeSelect.value;
  const title = materialTitleInput.value.trim();

  if (!courseId || !type || !title) {
    return alert("All fields are required.");
  }

  const course = courses.find(c => String(c.id) === String(courseId));

  const material = {
    id: Date.now(),
    courseId: course.id,
    courseCode: course.code,
    type,
    title,
    uploadedBy: "admin",
    date: new Date().toLocaleDateString()
  };

  materials.push(material);
  localStorage.setItem("materials", JSON.stringify(materials));

  alert("Material uploaded successfully.");

  uploadForm.reset();
});

