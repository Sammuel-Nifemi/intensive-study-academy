const token = localStorage.getItem("studentToken");
const API_BASE = "http://localhost:5000";

if (!token) {
  window.location.href = "/frontend/pages/student-login.html";
}

const params = new URLSearchParams(window.location.search);
const courseCode = String(
  params.get("course") || localStorage.getItem("activeCourseCode") || ""
).trim().toUpperCase();

let exam = null;
let questions = [];
let currentIndex = 0;
let remainingSeconds = 0;
let timerInterval = null;
const answers = {};

function setTitle(text) {
  const titleEl = document.getElementById("examTitle");
  if (titleEl) titleEl.textContent = text;
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function startTimer() {
  const timerEl = document.getElementById("timer");
  if (!timerEl) return;

  const tick = () => {
    timerEl.textContent = `Time left: ${formatTime(remainingSeconds)}`;
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      submitExam();
      return;
    }
    remainingSeconds -= 1;
  };

  tick();
  timerInterval = setInterval(tick, 1000);
}

function ensureNav() {
  const form = document.getElementById("examForm");
  if (!form || document.getElementById("examNavigator")) return;

  const nav = document.createElement("div");
  nav.id = "examNavigator";
  nav.style.margin = "12px 0";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.id = "prevBtn";
  prevBtn.textContent = "Previous";

  const counter = document.createElement("span");
  counter.id = "questionCounter";
  counter.style.margin = "0 10px";

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.id = "nextBtn";
  nextBtn.textContent = "Next";

  nav.appendChild(prevBtn);
  nav.appendChild(counter);
  nav.appendChild(nextBtn);
  form.insertBefore(nav, document.getElementById("questions"));

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderQuestion();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      renderQuestion();
    }
  });
}

function renderQuestion() {
  const question = questions[currentIndex];
  const questionsEl = document.getElementById("questions");
  if (!question || !questionsEl) return;

  const counter = document.getElementById("questionCounter");
  if (counter) counter.textContent = `${currentIndex + 1} / ${questions.length}`;

  const type = question.type === "fill" ? "fill" : "mcq";
  const options = Array.isArray(question.options) ? question.options : [];

  if (type === "fill") {
    const existing = String(answers[currentIndex] || "");
    questionsEl.innerHTML = `
      <div>
        <p>${currentIndex + 1}. ${question.text}</p>
        <input
          type="text"
          id="fill_answer_${currentIndex}"
          value="${existing.replace(/"/g, "&quot;")}"
          placeholder="Type your answer"
          style="width:100%;padding:10px;border:1px solid #d0d7de;border-radius:8px;"
        />
      </div>
    `;
    const fillInput = document.getElementById(`fill_answer_${currentIndex}`);
    fillInput?.addEventListener("input", () => {
      answers[currentIndex] = fillInput.value;
    });
    return;
  }

  questionsEl.innerHTML = `
    <div>
      <p>${currentIndex + 1}. ${question.text}</p>
      ${options
        .map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const checked = answers[currentIndex] === letter ? "checked" : "";
          return `
            <label style="display:block;margin-bottom:6px;">
              <input type="radio" name="q_${currentIndex}" value="${letter}" ${checked} />
              ${letter}. ${opt}
            </label>
          `;
        })
        .join("")}
    </div>
  `;

  questionsEl.querySelectorAll(`input[name="q_${currentIndex}"]`).forEach((input) => {
    input.addEventListener("change", () => {
      answers[currentIndex] = input.value;
    });
  });
}

async function submitExam() {
  clearInterval(timerInterval);

  const payload = questions.map((_, idx) => ({
    questionId: String(idx),
    answer: answers[idx] || ""
  }));

  try {
    const durationUsed = Math.max(0, Number(exam?.duration || 0) * 60 - remainingSeconds);
    const res = await fetch(`${API_BASE}/api/cbt/${encodeURIComponent(courseCode)}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        answers: payload,
        durationUsed
      })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || "Submission failed.");
      return;
    }

    alert(`Submitted. Score: ${data.score} / ${data.totalQuestions}`);
  } catch (err) {
    console.error(err);
    alert("Submission failed.");
  }
}

async function loadExam() {
  if (!courseCode) {
    setTitle("Course code missing.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/cbt/latest/${encodeURIComponent(courseCode)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setTitle(data.message || "CBT exam not available.");
      return;
    }

    exam = data;
    questions = Array.isArray(exam.questions) ? exam.questions : [];
    remainingSeconds = Number(exam.duration || 0) * 60;

    if (!questions.length) {
      setTitle("No questions available for this course.");
      return;
    }

    setTitle(`${exam.courseCode} CBT Exam`);
    ensureNav();
    renderQuestion();
    startTimer();
  } catch (err) {
    console.error(err);
    setTitle("Failed to load exam.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadExam();
  document.getElementById("examForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitExam();
  });
});
