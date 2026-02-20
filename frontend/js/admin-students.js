const adminToken = (localStorage.getItem("adminToken") || localStorage.getItem("token"));

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
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td>${s.fullName || ""}</td>
              <td>${s.email || ""}</td>
              <td>${s.status || "active"}</td>
              <td>
                <button data-flag="${s._id}" class="action-btn">Flag</button>
                <button data-suspend="${s._id}" class="action-btn">Suspend</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    container.querySelectorAll("[data-flag]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const reason = prompt("Reason for flagging:");
        if (!reason) return;
        const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/students/flag", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ studentId: btn.dataset.flag, reason })
        });
        if (res.ok) {
          alert("Student flagged");
        } else {
          alert("Failed to flag student");
        }
      });
    });

    container.querySelectorAll("[data-suspend]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/students/suspend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ studentId: btn.dataset.suspend })
        });
        if (res.ok) {
          alert("Student suspended");
          loadStudents();
        } else {
          alert("Failed to suspend student");
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", loadStudents);

