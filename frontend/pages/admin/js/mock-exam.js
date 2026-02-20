
/* ===============================
   PAGE GUARD
================================ */
const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "../admin-login.html";
}

/* ===============================
   DATA SOURCE
================================ */
let mockExams = JSON.parse(localStorage.getItem("mockExams")) || [];

/* ===============================
   RENDER EXAMS
================================ */
const table = document.getElementById("examsTable");

function renderExams() {
  table.innerHTML = "";

  if (mockExams.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">No mock exams created yet.</td>
      </tr>
    `;
    return;
  }

  mockExams.forEach(exam => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${exam.title}</td>
      <td>${exam.duration} mins</td>
      <td>
        <span class="status ${exam.status}">
          ${exam.status}
        </span>
      </td>
      <td>${exam.createdAt}</td>
      <td class="actions">
        <button onclick="manageQuestions('${exam.id}')">Questions</button>
        <button onclick="toggleStatus('${exam.id}')">
          ${exam.status === "draft" ? "Publish" : "Unpublish"}
        </button>
        <button class="danger" onclick="deleteExam('${exam.id}')">Delete</button>
      </td>
    `;

    table.appendChild(row);
  });
}

renderExams();

