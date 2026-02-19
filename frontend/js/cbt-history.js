const token = localStorage.getItem("studentToken");
if (!token) {
  window.location.href = "/frontend/pages/student-login.html";
}

const API_BASE = "http://localhost:5000/api/cbt";

function setStatus(message) {
  const el = document.getElementById("historyStatus");
  if (el) el.textContent = message;
}

function renderHistory(data) {
  const container = document.getElementById("historyContainer");
  if (!container) return;
  container.innerHTML = "";

  const courseCodes = Object.keys(data || {});
  if (!courseCodes.length) {
    setStatus("No CBT attempts yet.");
    return;
  }

  setStatus("");

  courseCodes.forEach((code) => {
    const attempts = data[code] || [];
    const section = document.createElement("div");
    section.className = "dashboard-section";
    section.style.marginTop = "16px";

    const title = document.createElement("h2");
    title.textContent = code;
    section.appendChild(title);

    const list = document.createElement("ul");
    attempts.forEach((attempt) => {
      const item = document.createElement("li");
      const date = attempt.submittedAt
        ? new Date(attempt.submittedAt).toLocaleString()
        : "—";
      item.textContent = `Score ${attempt.score}/${attempt.totalQuestions} (${attempt.percentage}%) — ${date}`;
      list.appendChild(item);
    });
    section.appendChild(list);

    container.appendChild(section);
  });
}

async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE}/me/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.message || "Failed to load history.");
      return;
    }
    renderHistory(data);
  } catch (err) {
    console.error(err);
    setStatus("Failed to load history.");
  }
}

document.addEventListener("DOMContentLoaded", loadHistory);

