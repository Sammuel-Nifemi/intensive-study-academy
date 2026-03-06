const adminToken = (localStorage.getItem("adminToken") || localStorage.getItem("token"));
let studentsTableWired = false;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderUsage(items) {
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) return "<p>No usage yet.</p>";
  return rows
    .map(
      (item) =>
        `<p><strong>${escapeHtml(item.materialTitle)}</strong> - ${Number(item.count || 0)}</p>`
    )
    .join("");
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function openStudentModal(payload) {
  const modal = document.getElementById("studentDetailsModal");
  const body = document.getElementById("studentModalBody");
  if (!modal || !body) return;

  const student = payload?.student || {};
  const usage = payload?.topUsedMaterials || {};
  const createdAt = student.createdAt ? new Date(student.createdAt).toLocaleString() : "-";

  body.innerHTML = `
    <section class="student-section">
      <h3>Student Details</h3>
      <div class="student-modal-grid">
        <p><strong>Name:</strong> ${escapeHtml(student.fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(student.email)}</p>
        <p><strong>Status:</strong> ${escapeHtml(student.status)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(student.phone)}</p>
        <p><strong>Matric No:</strong> ${escapeHtml(student.matricNo)}</p>
        <p><strong>Level:</strong> ${escapeHtml(student.level)}</p>
        <p><strong>Semester:</strong> ${escapeHtml(student.semester)}</p>
        <p><strong>Program:</strong> ${escapeHtml(student.programName)}</p>
        <p><strong>Study Center:</strong> ${escapeHtml(student.studyCenter)}</p>
        <p><strong>Faculty:</strong> ${escapeHtml(student.facultyName)}</p>
        <p><strong>Referral Code:</strong> ${escapeHtml(student.referralCode)}</p>
        <p><strong>Referral Count:</strong> ${Number(payload?.referralCount || 0)}</p>
        <p><strong>Last Login:</strong> ${escapeHtml(formatDateTime(student.lastLogin))}</p>
        <p><strong>Login Count:</strong> ${Number(student.loginCount || 0)}</p>
        <p><strong>Joined:</strong> ${escapeHtml(createdAt)}</p>
      </div>
    </section>
    <section class="student-section">
      <h3>Usage Summary</h3>
      <div class="student-usage-grid">
        <article class="student-usage-card">
          <h4>Top Past Questions</h4>
          ${renderUsage(usage.pastQuestions)}
        </article>
        <article class="student-usage-card">
          <h4>Top Raw Materials</h4>
          ${renderUsage(usage.rawMaterials)}
        </article>
        <article class="student-usage-card">
          <h4>Top Mocks</h4>
          ${renderUsage(usage.mocks)}
        </article>
      </div>
    </section>
  `;

  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

function closeStudentModal() {
  const modal = document.getElementById("studentDetailsModal");
  if (!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

async function viewStudent(studentId) {
  const res = await fetch((window.ISA_API_ORIGIN || "") + `/api/admin/students/${encodeURIComponent(studentId)}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(data.message || "Failed to load student details");
    return;
  }
  openStudentModal(data);
}

async function flagStudent(studentId) {
  const reason = prompt("Reason for flagging:");
  if (!reason) return;
  const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/students/flag", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ studentId, reason })
  });
  if (res.ok) {
    alert("Student flagged");
    return;
  }
  alert("Failed to flag student");
}

async function suspendStudent(studentId) {
  const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/students/suspend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ studentId })
  });
  if (res.ok) {
    alert("Student suspended");
    await loadStudents();
    return;
  }
  alert("Failed to suspend student");
}

function wireStudentsTableActions() {
  if (studentsTableWired) return;
  const container = document.getElementById("studentsTable");
  if (!container) return;

  container.addEventListener("click", async (event) => {
    const viewBtn = event.target.closest("[data-view]");
    if (viewBtn) {
      await viewStudent(viewBtn.dataset.view);
      return;
    }

    const flagBtn = event.target.closest("[data-flag]");
    if (flagBtn) {
      await flagStudent(flagBtn.dataset.flag);
      return;
    }

    const suspendBtn = event.target.closest("[data-suspend]");
    if (suspendBtn) {
      await suspendStudent(suspendBtn.dataset.suspend);
    }
  });

  studentsTableWired = true;
}

function wireModalActions() {
  const closeBtn = document.getElementById("closeStudentModalBtn");
  const modal = document.getElementById("studentDetailsModal");
  if (closeBtn && closeBtn.dataset.wired !== "1") {
    closeBtn.dataset.wired = "1";
    closeBtn.addEventListener("click", closeStudentModal);
  }
  if (modal && modal.dataset.wired !== "1") {
    modal.dataset.wired = "1";
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeStudentModal();
    });
  }
}

async function loadStudents() {
  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/students", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const students = await res.json();
    if (!res.ok) return;

    const container = document.getElementById("studentsTable");
    if (!container) return;

    container.innerHTML = `
      <div class="students-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Study Center</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td><span class="student-name">${escapeHtml(s.fullName || "")}</span></td>
              <td><span class="student-email" title="${escapeHtml(s.email || "")}">${escapeHtml(s.email || "")}</span></td>
              <td class="nowrap-cell">${escapeHtml(s.phone || "-")}</td>
              <td class="nowrap-cell">${escapeHtml(s.studyCenter || "-")}</td>
              <td>${escapeHtml(s.status || "active")}</td>
              <td class="action-row">
                <button data-view="${s._id}" class="action-btn">View</button>
                <button data-flag="${s._id}" class="action-btn">Flag</button>
                <button data-suspend="${s._id}" class="action-btn">Suspend</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      </div>
    `;
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  wireStudentsTableActions();
  wireModalActions();
  loadStudents();
});

