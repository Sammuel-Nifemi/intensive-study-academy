/* ===============================
   PAGE GUARD
================================ */
const token = (localStorage.getItem("adminToken") || localStorage.getItem("token"));

if (!token) {
  window.location.href = "../admin-login.html";
}

/* ===============================
   CREATE EXAM LOGIC
================================ */
const form = document.getElementById("createExamForm");

let mockExams = JSON.parse(localStorage.getItem("mockExams")) || [];

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const duration = document.getElementById("duration").value;

  if (!title || !duration) {
    alert("Title and duration are required.");
    return;
  }

  const newExam = {
    id: "exam_" + Date.now(),
    title,
    description,
    duration: Number(duration),
    status: "draft",
    createdAt: new Date().toISOString().split("T")[0],
    questions: []
  };

  mockExams.push(newExam);
  localStorage.setItem("mockExams", JSON.stringify(mockExams));

  window.location.href = "index.html";
});

