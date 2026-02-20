const token = localStorage.getItem("studentToken");
if (!token) {
  window.location.href = "/frontend/pages/student-login.html";
}

const API_BASE = (window.ISA_API_ORIGIN || "") + "/api/cbt";

let questions = [];
let currentIndex = 0;
let answers = {};
let remainingSeconds = 0;
let timerInterval = null;
let examDurationSeconds = 0;
let submitted = false;

function getCourseCode() {
  const params = new URLSearchParams(window.location.search);
  const course = params.get("course");
  return course ? course.toUpperCase() : "";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatTime(totalSeconds) {
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function startTimer() {
  const timerEl = document.getElementById("cbtTimer");
  const tick = () => {
    if (timerEl) {
      timerEl.textContent = `Hurry up, the time is ticking! ${formatTime(remainingSeconds)}`;
    }
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

function lockExam() {
  setText("cbtStatus", "Time up! Your answers have been submitted.");
  document.getElementById("cbtOptions").querySelectorAll("input").forEach((input) => {
    input.disabled = true;
  });
  document.getElementById("clearBtn").disabled = true;
  document.getElementById("prevBtn").disabled = true;
  document.getElementById("nextBtn").disabled = true;
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.disabled = true;
}

function renderQuestion() {
  const question = questions[currentIndex];
  if (!question) return;

  setText("cbtCounter", `${currentIndex + 1} / ${questions.length}`);
  setText("cbtQuestionText", question.questionText);

  const optionsEl = document.getElementById("cbtOptions");
  optionsEl.innerHTML = "";

  if (question.questionType === "mcq") {
    question.options.forEach((opt, idx) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "cbtOption";
      input.value = String.fromCharCode(65 + idx);
      if (answers[question._id] === input.value) {
        input.checked = true;
      }
      input.addEventListener("change", () => {
        answers[question._id] = input.value;
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(` ${String.fromCharCode(65 + idx)}. ${opt}`));
      optionsEl.appendChild(label);
    });
  } else {
    const input = document.createElement("input");
    input.type = "text";
    input.value = answers[question._id] || "";
    input.placeholder = "Type your answer";
    input.addEventListener("input", () => {
      answers[question._id] = input.value;
    });
    optionsEl.appendChild(input);
  }
}

function clearAnswer() {
  const question = questions[currentIndex];
  if (!question) return;
  delete answers[question._id];
  renderQuestion();
}

async function loadExam() {
  const courseCode = getCourseCode();
  if (!courseCode) {
    setText("cbtStatus", "Course code missing.");
    return;
  }

  setText("cbtCategory", `Category: ${courseCode}`);

  const examRes = await fetch(`${API_BASE}/${courseCode}/exam`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!examRes.ok) {
    setText("cbtStatus", "Exam not available.");
    return;
  }
  const exam = await examRes.json();
  examDurationSeconds = (Number(exam.durationMinutes) || 50) * 60;
  remainingSeconds = examDurationSeconds;

  const questionRes = await fetch(`${API_BASE}/${courseCode}/questions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!questionRes.ok) {
    setText("cbtStatus", "Failed to load questions.");
    return;
  }
  const data = await questionRes.json();
  questions = Array.isArray(data) ? data : data.questions || [];
  if (!questions.length) {
    setText("cbtStatus", "No questions found.");
    return;
  }

  renderQuestion();
  startTimer();
}

function buildAnswerPayload() {
  return questions.map((q) => ({
    questionId: q._id,
    answer: answers[q._id] || ""
  }));
}

async function submitExam() {
  if (submitted) return;
  submitted = true;

  const courseCode = getCourseCode();
  if (!courseCode) {
    setText("cbtStatus", "Course code missing.");
    return;
  }

  const durationUsed = Math.max(0, examDurationSeconds - remainingSeconds);
  setText("cbtStatus", "Submitting your answers...");

  try {
    const res = await fetch(`${API_BASE}/${courseCode}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        answers: buildAnswerPayload(),
        durationUsed
      })
    });

    const data = await res.json();
    if (!res.ok) {
      setText("cbtStatus", data.message || "Submission failed.");
      submitted = false;
      return;
    }

    setText("cbtStatus", "Submission complete.");
    setText("cbtScoreText", `Score: ${data.score} / ${data.totalQuestions}`);
    setText("cbtPercentText", `Percentage: ${data.percentage}%`);
    document.getElementById("cbtResult").style.display = "block";
    lockExam();
  } catch (err) {
    console.error(err);
    setText("cbtStatus", "Submission failed.");
    submitted = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadExam();
  document.getElementById("clearBtn").addEventListener("click", clearAnswer);
  document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderQuestion();
    }
  });
  document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      renderQuestion();
    }
  });
  document.getElementById("submitBtn").addEventListener("click", submitExam);
});


