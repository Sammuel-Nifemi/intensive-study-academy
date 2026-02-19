const token = localStorage.getItem("studentToken");

if (!token) {
  window.location.href = "/frontend/pages/student-login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadTimetables();
});

async function loadTimetables() {
  const statusEl = document.getElementById("timetableStatus");
  const listEl = document.getElementById("timetableList");
  if (!statusEl || !listEl) return;

  try {
    const res = await fetch("http://localhost:5000/api/students/exam-timetables", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.message || "No timetables found.";
      return;
    }

    statusEl.textContent = "";
    listEl.innerHTML = data
      .map((item) => {
        return `
          <div class="activity-list" style="margin-bottom:10px;">
            <strong>${item.title}</strong>
            <div><a class="action-btn" href="${item.fileUrl}" target="_blank">Download PDF</a></div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load timetables.";
  }
}


