/* ===============================
   LOAD EXAM
================================ */
const exams = JSON.parse(localStorage.getItem("mockExams")) || [];

// for now: load first published exam
const exam = exams.find(e => e.status === "published");

if (!exam) {
  alert("No available exam");
  window.location.href = "/";
}

document.getElementById("examTitle").innerText = exam.title;

let currentIndex = 0;
let answers = {};

/* ===============================
   RENDER QUESTION
================================ */
function renderQuestion() {
  const q = exam.questions[currentIndex];

  document.getElementById("questionText").innerText =
    `${currentIndex + 1}. ${q.text}`;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  for (let key in q.options) {
    const label = document.createElement("label");
    label.style.display = "block";

    label.innerHTML = `
      <input type="radio" name="option" value="${key}"
        ${answers[currentIndex] === key ? "checked" : ""}
      />
      ${key}. ${q.options[key]}
    `;

    optionsDiv.appendChild(label);
  }
}

renderQuestion();

/* ===============================
   NEXT BUTTON
================================ */
document.getElementById("nextBtn").addEventListener("click", () => {
  const selected = document.querySelector("input[name='option']:checked");

  if (!selected) {
    alert("Select an answer");
    return;
  }

  answers[currentIndex] = selected.value;

  if (currentIndex < exam.questions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    submitExam();
  }
});

const EXAM_DURATION_MINUTES = 90;
const TIMER_KEY = "examEndTime";

// set end time only once
let endTime = localStorage.getItem(TIMER_KEY);

if (!endTime) {
  endTime = Date.now() + EXAM_DURATION_MINUTES * 60 * 1000;
  localStorage.setItem(TIMER_KEY, endTime);
}

endTime = Number(endTime);

function startTimer() {
  const timerEl = document.getElementById("timer");

  const interval = setInterval(() => {
    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0) {
      clearInterval(interval);
      timerEl.innerText = "Time up!";
      submitExam(true);
      return;
    }

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);

    timerEl.innerText =
      `Time left: ${mins}:${secs.toString().padStart(2, "0")}`;
  }, 1000);
}

startTimer();

/* ===============================
   SUBMIT (TEMP)
================================ */
function submitExam(auto = false) {
  localStorage.removeItem("examEndTime");

  const score = calculateScore();

  const results =
    JSON.parse(localStorage.getItem("examResults")) || [];

  results.push({
    examId: exam.id,
    studentId: "student_demo_001", // later: real auth ID
    score,
    total: exam.questions.length,
    answers,
    submittedAt: new Date().toISOString()
  });

  localStorage.setItem("examResults", JSON.stringify(results));

  alert(
    auto
      ? "Time up! Exam auto-submitted."
      : "Exam submitted successfully."
  );

  renderReview(score);
}



function calculateScore() {
  let score = 0;

  exam.questions.forEach((q, index) => {
    if (answers[index] === q.correct) {
      score++;
    }
  });

  return score;
}
function renderReview(score) {
  document.querySelector(".form-card").style.display = "none";
  document.getElementById("reviewSection").style.display = "block";

  const scoreText = document.getElementById("scoreText");
  scoreText.innerText =
    `You scored ${score} / ${exam.questions.length}`;

  const container = document.getElementById("reviewContainer");
  container.innerHTML = "";

  exam.questions.forEach((q, index) => {
    const studentAnswer = answers[index];
    const isCorrect = studentAnswer === q.correct;

    const div = document.createElement("div");
    div.style.marginBottom = "20px";

    div.innerHTML = `
      <p><strong>Q${index + 1}:</strong> ${q.text}</p>
      <p>Your answer: 
        <strong style="color:${isCorrect ? "green" : "red"}">
          ${studentAnswer || "Not answered"}
        </strong>
      </p>
      <p>Correct answer: 
        <strong style="color:green">${q.correct}</strong>
      </p>
    `;

    container.appendChild(div);
  });
}
