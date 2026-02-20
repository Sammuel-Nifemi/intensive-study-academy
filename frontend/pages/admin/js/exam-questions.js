/* ===============================
   PAGE GUARD
================================ */
const token = (localStorage.getItem("adminToken") || localStorage.getItem("token"));

if (!token) {
  window.location.href = "../admin-login.html";
}

/* ===============================
   QUESTIONS MANAGER LOGIC
================================ */
const examId = localStorage.getItem("currentExamId");

if (!examId) {
  alert("No exam selected");
  window.location.href = "index.html";
}

let exams = JSON.parse(localStorage.getItem("mockExams")) || [];
let exam = exams.find(e => e.id === examId);

if (!exam) {
  alert("Exam not found");
  window.location.href = "index.html";
}

const examTitle = document.getElementById("examTitle");
const table = document.getElementById("questionsTable");

examTitle.innerText = `Questions — ${exam.title}`;

function renderQuestions() {
  table.innerHTML = "";

  if (exam.questions.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;">
          No questions added yet
        </td>
      </tr>`;
    return;
  }

  exam.questions.forEach((q, index) => {
    table.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${q.text}</td>
        <td>${q.correct}</td>
        <td>
          <button class="danger" onclick="deleteQuestion(${index})">
            Delete
          </button>
        </td>
      </tr>
    `;
  });
}

renderQuestions();

function addQuestion() {
  const text = questionText.value.trim();
  const A = optA.value.trim();
  const B = optB.value.trim();
  const C = optC.value.trim();
  const D = optD.value.trim();
  const correct = document.getElementById("correct").value;

  if (!text || !A || !B || !C || !D || !correct) {
    alert("Fill all fields");
    return;
  }

  exam.questions.push({
    text,
    options: { A, B, C, D },
    correct
  });

  saveExam();
  renderQuestions();
  clearForm();
}

function deleteQuestion(index) {
  if (!confirm("Delete this question?")) return;
  exam.questions.splice(index, 1);
  saveExam();
  renderQuestions();
}

function saveExam() {
  exams = exams.map(e => e.id === exam.id ? exam : e);
  localStorage.setItem("mockExams", JSON.stringify(exams));
}

function clearForm() {
  questionText.value =
  optA.value =
  optB.value =
  optC.value =
  optD.value = "";
  correct.value = "";
}

