
/* =====================================================
   ADMIN → STAFF COURSE ASSIGNMENT
===================================================== */

const staffEmailInput = document.getElementById("staffEmailInput");
const courseSelect = document.getElementById("courseSelect");
const assignBtn = document.getElementById("assignBtn");
const assignmentList = document.getElementById("assignmentList");

const courses = JSON.parse(localStorage.getItem("courses")) || [];
let staffAssignments =
  JSON.parse(localStorage.getItem("staffAssignments")) || [];

/* ================= LOAD COURSES ================= */
function loadCourses() {
  courseSelect.innerHTML = "";
  courses.forEach(course => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.code} – ${course.title}`;
    courseSelect.appendChild(option);
  });
}

/* ================= ASSIGN COURSES ================= */
assignBtn.addEventListener("click", () => {
  const email = staffEmailInput.value.trim();
  const selected = Array.from(courseSelect.selectedOptions).map(
    o => Number(o.value)
  );

  if (!email || !selected.length) {
    alert("Staff email and courses are required.");
    return;
  }

  let assignment = staffAssignments.find(a => a.email === email);

  if (!assignment) {
    assignment = { email, courseIds: [] };
    staffAssignments.push(assignment);
  }

  assignment.courseIds = selected;

  localStorage.setItem(
    "staffAssignments",
    JSON.stringify(staffAssignments)
  );

  staffEmailInput.value = "";
  renderAssignments();
});

/* ================= DISPLAY ================= */
function renderAssignments() {
  assignmentList.innerHTML = "";

  staffAssignments.forEach(a => {
    const names = courses
      .filter(c => a.courseIds.includes(c.id))
      .map(c => c.code)
      .join(", ");

    const li = document.createElement("li");
    li.innerHTML = `<strong>${a.email}</strong>: ${names}`;
    assignmentList.appendChild(li);
  });
}

loadCourses();
renderAssignments();
