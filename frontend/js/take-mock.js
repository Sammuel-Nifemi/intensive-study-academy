/* =====================================================
   LIVE MOCK EXAM SESSION (STUDENT)
===================================================== */

/* ================= PAGE GUARD ================= */
const token = localStorage.getItem("studentToken");

if (!token) {
  // window.location.href = "../pages/student-login.html";
}

/* ================= STORAGE ================= */
const mockExams =
  JSON.parse(localStorage.getItem("mockExams")) || [];

/* ================= CONTEXT ================= */
const activeExamId =
  Number(localStorage.getItem("activeMockExamId"));

const exam = mockExams.find(e => e.id === activeExamId);

if (!exam) {
  alert("Mock exam not found.");
  window.location.href = "mock-exams.html";
}

/* ================= SAFETY CHECK ================= */
if (!exam.questions || !exam.questions.length) {
  alert("This mock exam has no questions yet.");
  window.location.href = "mock-exams.html";
}

/* ================= DOM ================= */
const examTitleEl = document.getElementById("examTitle");
const timerEl = document.getElementById("timer");
const questionContainer = document.getElementById("questionContainer");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const examForm = document.getElementById("examForm");

/* ================= STATE ================= */
let currentIndex = 0;
let answers = {};
let timeLeft = exam.duration * 60;

/* ================= TITLE ================= */
examTitleEl.textContent = exam.title;

/* ================= TIMER ================= */
const countdown = setInterval(() => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  timerEl.textContent =
    `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  timeLeft--;

  if (timeLeft < 0) {
    clearInterval(countdown);
    submitExam();
  }
}, 1000);

/* ================= RENDER QUESTION ================= */
function renderQuestion() {
  const q = exam.questions[currentIndex];

  questionContainer.innerHTML = `
    <h3>Question ${currentIndex + 1} of ${exam.questions.length}</h3>
    <p>${q.question}</p>

    ${q.options
      .map(
        (opt, i) => `
        <label class="option">
          <input
            type="radio"
            name="answer"
            value="${i}"
            ${answers[q.id] === i ? "checked" : ""}
          />
          ${opt}
        </label>
      `
      )
      .join("")}
  `;

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === exam.questions.length - 1;
}

/* ================= SAVE ANSWER ================= */
function saveAnswer() {
  const selected =
    document.querySelector('input[name="answer"]:checked');

  if (selected) {
    answers[exam.questions[currentIndex].id] =
      Number(selected.value);
  }
}

/* ================= NAVIGATION ================= */
prevBtn.onclick = () => {
  saveAnswer();
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
};

nextBtn.onclick = () => {
  saveAnswer();
  if (currentIndex < exam.questions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
};

/* ================= SUBMIT ================= */
examForm.onsubmit = e => {
  e.preventDefault();
  submitExam();
};

function submitExam() {
  saveAnswer();
  clearInterval(countdown);

  const result = exam.questions.map(q => ({
    questionId: q.id,
    correct: q.correctIndex,
    selected: answers[q.id] ?? null
  }));

  localStorage.setItem(
    "lastMockResult",
    JSON.stringify({
      examId: exam.id,
      answers: result,
      submittedAt: Date.now()
    })
  );

  alert("Mock exam submitted successfully.");
  window.location.href = "mock-result.html";
}

/* ================= INIT ================= */
renderQuestion();

