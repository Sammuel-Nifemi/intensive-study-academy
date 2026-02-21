
/* =====================================================
   STAFF / ADMIN MOCK EXAM MANAGER
===================================================== */

/* ================= ROLE GUARD ================= */
const token = localStorage.getItem("staffToken");

if (!token) {
  window.location.href = ".../staff-login.html";
}

/* ================= STORAGE ================= */
const courses =
  JSON.parse(localStorage.getItem("courses")) || [];

let mockExams =
  JSON.parse(localStorage.getItem("mockExams")) || [];

/* ================= DOM ================= */
const courseSelect = document.getElementById("courseSelect");
const examTitleInput = document.getElementById("examTitleInput");
const examDurationInput = document.getElementById("examDurationInput");
const createExamBtn = document.getElementById("createExamBtn");

const questionInput = document.getElementById("questionInput");
const optionInputs = document.querySelectorAll(".optionInput");
const correctAnswerSelect = document.getElementById("correctAnswerSelect");
const addQuestionBtn = document.getElementById("addQuestionBtn");

const mockExamList = document.getElementById("mockExamList");

/* ================= CURRENT EXAM ================= */
let currentExamId = null;

/* ================= LOAD COURSES ================= */
function loadCourses() {
  courseSelect.innerHTML = `<option value="">Select Course</option>`;

  courses.forEach(course => {
    const opt = document.createElement("option");
    opt.value = course.id;
    opt.textContent = `${course.code} â€“ ${course.title}`;
    courseSelect.appendChild(opt);
  });
}

/* ================= CREATE EXAM ================= */
createExamBtn.onclick = () => {
  const courseId = courseSelect.value;
  const title = examTitleInput.value.trim();
  const duration = examDurationInput.value;

  if (!courseId || !title || !duration) {
    return alert("All fields required");
  }

  const duplicate = mockExams.find(
    e => e.courseId == courseId && e.title === title
  );

  if (duplicate) {
    return alert("Mock exam already exists for this course");
  }

  const exam = {
    id: Date.now(),
    courseId,
    title,
    duration,
    questions: [],
    status: "active"
  };

  mockExams.push(exam);
  save();

  currentExamId = exam.id;

  examTitleInput.value = "";
  examDurationInput.value = "";

  alert("Mock exam created. Now add questions.");
};

/* ================= ADD QUESTION ================= */
addQuestionBtn.onclick = () => {
  if (!currentExamId) {
    return alert("Create an exam first");
  }

  const questionText = questionInput.value.trim();
  const options = [...optionInputs].map(i => i.value.trim());
  const correctIndex = correctAnswerSelect.value;

  if (!questionText || options.some(o => !o) || correctIndex === "") {
    return alert("Complete question and options");
  }

  const exam = mockExams.find(e => e.id === currentExamId);

  exam.questions.push({
    id: Date.now(),
    question: questionText,
    options,
    correctIndex: Number(correctIndex)
  });

  questionInput.value = "";
  optionInputs.forEach(i => (i.value = ""));
  correctAnswerSelect.value = "";

  save();
};

/* ================= SAVE ================= */
function save() {
  localStorage.setItem("mockExams", JSON.stringify(mockExams));
  renderExams();
}

/* ================= RENDER ================= */
function renderExams() {
  mockExamList.innerHTML = "";

  if (!mockExams.length) {
    mockExamList.innerHTML = `<li>No mock exams yet.</li>`;
    return;
  }

  mockExams.forEach(exam => {
    const course = courses.find(c => c.id == exam.courseId);

    mockExamList.innerHTML += `
      <li>
        <strong>${exam.title}</strong><br>
        Course: ${course?.code || "Unknown"}<br>
        Questions: ${exam.questions.length}<br>
        Duration: ${exam.duration} mins
      </li>
    `;
  });
}

/* ================= INIT ================= */
loadCourses();
renderExams();

