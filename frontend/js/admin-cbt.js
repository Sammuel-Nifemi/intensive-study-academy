const API_BASE = (window.ISA_API_ORIGIN || "") + "/api/admin";
const token = localStorage.getItem("adminToken");
const sessionQuestions = [];

function setStatus(message, isError) {
  const el = document.getElementById("cbtStatus");
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
}

function readQuestionForm() {
  const type = String(document.getElementById("questionType")?.value || "mcq").trim().toLowerCase();
  const text = String(document.getElementById("questionText")?.value || "").trim();
  const optionA = String(document.getElementById("optionA")?.value || "").trim();
  const optionB = String(document.getElementById("optionB")?.value || "").trim();
  const optionC = String(document.getElementById("optionC")?.value || "").trim();
  const optionD = String(document.getElementById("optionD")?.value || "").trim();
  const fillAnswer = String(document.getElementById("fillAnswer")?.value || "").trim();
  const correctAnswer = String(document.getElementById("correctAnswer")?.value || "").trim().toUpperCase();
  if (type === "fill") {
    return { type, text, options: [], correctAnswer: fillAnswer };
  }
  return { type, text, options: [optionA, optionB, optionC, optionD], correctAnswer };
}

function clearQuestionForm() {
  ["questionText", "optionA", "optionB", "optionC", "optionD", "fillAnswer"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const correct = document.getElementById("correctAnswer");
  if (correct) correct.value = "A";
}

function toggleQuestionTypeFields() {
  const type = String(document.getElementById("questionType")?.value || "mcq").trim().toLowerCase();
  const mcqFields = document.getElementById("mcqFields");
  const fillFields = document.getElementById("fillFields");
  if (!mcqFields || !fillFields) return;

  if (type === "fill") {
    mcqFields.style.display = "none";
    fillFields.style.display = "block";
  } else {
    mcqFields.style.display = "block";
    fillFields.style.display = "none";
  }
}

function appendLog(text) {
  const list = document.getElementById("questionList");
  if (!list) return;
  const item = document.createElement("li");
  item.textContent = text;
  list.appendChild(item);
}

function renderSessionQuestions() {
  const list = document.getElementById("questionList");
  if (!list) return;
  if (!sessionQuestions.length) {
    list.innerHTML = "<li>Questions added in this session will appear here.</li>";
    return;
  }

  list.innerHTML = "";
  sessionQuestions.forEach((q) => {
    const item = document.createElement("li");
    const label = `[${q.type.toUpperCase()}] ${q.text}`;
    const text = document.createElement("span");
    text.textContent = `Added: ${label} `;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Delete";
    btn.className = "action-btn";
    btn.style.marginLeft = "8px";
    btn.addEventListener("click", () => deleteFromBank(q.id));

    item.appendChild(text);
    item.appendChild(btn);
    list.appendChild(item);
  });
}

async function deleteFromBank(localId) {
  const item = sessionQuestions.find((q) => q.id === localId);
  if (!item) return;

  setStatus("Deleting question...", false);
  try {
    const res = await fetch(`${API_BASE}/question-bank`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        courseCode: item.courseCode,
        type: item.type,
        text: item.text,
        options: item.options,
        correctAnswer: item.correctAnswer
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.message || "Failed to delete question.", true);
      return;
    }

    const idx = sessionQuestions.findIndex((q) => q.id === localId);
    if (idx >= 0) sessionQuestions.splice(idx, 1);
    renderSessionQuestions();
    setStatus(`Question deleted. Total in bank: ${data.totalQuestions || "-"}.`, false);
  } catch (err) {
    console.error(err);
    setStatus("Failed to delete question.", true);
  }
}

async function addToBank() {
  const courseCode = String(document.getElementById("courseCode")?.value || "").trim().toUpperCase();
  const { type, text, options, correctAnswer } = readQuestionForm();

  if (!courseCode || !text || !correctAnswer) {
    setStatus("Course code, question text and correct answer are required.", true);
    return;
  }

  if (type === "mcq" && options.some((opt) => !opt)) {
    setStatus("All MCQ options are required.", true);
    return;
  }

  setStatus("Adding question to bank...", false);
  try {
    const res = await fetch(`${API_BASE}/question-bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        courseCode,
        type,
        text,
        options,
        correctAnswer
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.message || "Failed to add to question bank.", true);
      return;
    }

    const localItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      courseCode,
      type,
      text,
      options,
      correctAnswer
    };
    sessionQuestions.push(localItem);
    renderSessionQuestions();
    clearQuestionForm();
    setStatus(`Question added. Total in bank: ${data.totalQuestions || "-"}.`, false);
  } catch (err) {
    console.error(err);
    setStatus("Failed to add to question bank.", true);
  }
}

async function generateMock() {
  const courseCode = String(document.getElementById("courseCode")?.value || "").trim().toUpperCase();
  const duration = Number(document.getElementById("duration")?.value || 0);
  if (!courseCode || !duration) {
    setStatus("Course code and duration are required.", true);
    return;
  }

  setStatus("Generating mock exam...", false);
  try {
    const res = await fetch(`${API_BASE}/generate-mock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ courseCode, duration })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.message || "Failed to generate mock exam.", true);
      return;
    }

    setStatus(`Mock generated with ${data.totalQuestions || 0} questions.`, false);
  } catch (err) {
    console.error(err);
    setStatus("Failed to generate mock exam.", true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderSessionQuestions();
  document.getElementById("questionType")?.addEventListener("change", toggleQuestionTypeFields);
  toggleQuestionTypeFields();
  document.getElementById("addToBankBtn")?.addEventListener("click", addToBank);
  document.getElementById("generateMockBtn")?.addEventListener("click", generateMock);
});
