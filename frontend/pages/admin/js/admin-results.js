
/* ===============================
   PAGE GUARD
================================ */
const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "../admin-login.html";
}

/* ===============================
   LOAD DATA
================================ */
const exams = JSON.parse(localStorage.getItem("mockExams")) || [];
const results = JSON.parse(localStorage.getItem("examResults")) || [];

const table = document.getElementById("resultsTable");

if (results.length === 0) {
  table.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center;">
        No results yet
      </td>
    </tr>
  `;
}

/* ===============================
   RENDER RESULTS
================================ */
results.forEach(r => {
  const exam = exams.find(e => e.id === r.examId);

  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${exam ? exam.title : "Unknown Exam"}</td>
    <td>${r.studentId}</td>
    <td>${r.score} / ${r.total}</td>
    <td>${new Date(r.submittedAt).toLocaleString()}</td>
  `;

  table.appendChild(row);
});
