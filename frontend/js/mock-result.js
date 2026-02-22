

/* =====================================================
   MOCK EXAM RESULT (STUDENT)
===================================================== */

/* ================= PAGE GUARD ================= */
const token = localStorage.getItem("studentToken");

if (!token) {
  window.location.href = "/pages/mock-exams.html";


}

/* ================= READ RESULT ================= */
const lastResult =
  JSON.parse(localStorage.getItem("lastMockResult"));

const mockExams =
  JSON.parse(localStorage.getItem("mockExams")) || [];

if (!lastResult) {
  alert("No mock result found.");
  window.location.href = "/pages/mock-exams.html";
}

/* ================= FIND EXAM ================= */
const exam = mockExams.find(e => e.id === lastResult.examId);

if (!exam) {
  alert("Exam data missing.");
  window.location.href = "/pages/mock-exams.html";
}

/* ================= DOM ================= */
const examTitleEl = document.getElementById("examTitle");
const totalQuestionsEl = document.getElementById("totalQuestions");
const correctCountEl = document.getElementById("correctCount");
const wrongCountEl = document.getElementById("wrongCount");
const scorePercentEl = document.getElementById("scorePercent");
const resultList = document.getElementById("resultList");

/* ================= PROCESS RESULT ================= */
let correct = 0;
let wrong = 0;

examTitleEl.textContent = exam.title;
totalQuestionsEl.textContent = exam.questions.length;

lastResult.answers.forEach(a => {
  if (a.selected === a.correct) {
    correct++;
  } else {
    wrong++;
  }
});

correctCountEl.textContent = correct;
wrongCountEl.textContent = wrong;

const percent =
  Math.round((correct / exam.questions.length) * 100);

scorePercentEl.textContent = `${percent}%`;

/* ================= BREAKDOWN ================= */
resultList.innerHTML = "";

exam.questions.forEach(q => {
  const ans = lastResult.answers.find(a => a.questionId === q.id);

  const isCorrect = ans && ans.selected === q.correctIndex;

  resultList.innerHTML += `
    <li class="${isCorrect ? "correct" : "wrong"}">
      <strong>${q.question}</strong><br>
      Your answer: ${
        ans?.selected !== null
          ? q.options[ans.selected]
          : "No answer"
      }<br>
      Correct answer: ${q.options[q.correctIndex]}
    </li>
  `;
});


