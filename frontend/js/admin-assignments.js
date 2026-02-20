const API_BASE = (window.ISA_API_ORIGIN || "") + "";

const assignmentsBody = document.getElementById("assignmentsBody");
const responsesBody = document.getElementById("responsesBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const statusBar = document.getElementById("statusBar");
const refreshBtn = document.getElementById("refreshBtn");

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

function setStatus(message, isError = false) {
  if (!statusBar) return;
  if (!message) {
    statusBar.hidden = true;
    statusBar.textContent = "";
    statusBar.classList.remove("error");
    return;
  }
  statusBar.hidden = false;
  statusBar.textContent = message;
  statusBar.classList.toggle("error", Boolean(isError));
}

function setLoading(isLoading) {
  if (loadingState) loadingState.hidden = !isLoading;
}

function setEmpty(isEmpty) {
  if (emptyState) emptyState.hidden = !isEmpty;
}

function formatPhoneLink(phone) {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function formatEmailLink(email) {
  if (!email) return "—";
  return `mailto:${email}`;
}

function renderWeakTopics(topics) {
  if (!Array.isArray(topics) || topics.length === 0) {
    return "<span>—</span>";
  }
  return topics.map((t) => `<span class="topic-pill">${t}</span>`).join("");
}

function renderRows(requests) {
  if (!assignmentsBody) return;
  if (!Array.isArray(requests) || requests.length === 0) {
    assignmentsBody.innerHTML = `<tr><td colspan="8">No assignment requests yet.</td></tr>`;
    return;
  }

  assignmentsBody.innerHTML = requests
    .map((req) => {
      const phone = req.phone || "";
      const email = req.email || "";
      const phoneLink = formatPhoneLink(phone);
      const emailLink = formatEmailLink(email);
      const status = (req.status || "pending").toLowerCase();

      return `
        <tr data-id="${req._id}">
          <td>${req.studentName || "—"}</td>
          <td>${typeof req.score === "number" ? req.score : "—"}</td>
          <td>${renderWeakTopics(req.weakTopics)}</td>
          <td>${req.studyCenter || "—"}</td>
          <td>
            ${
              phone
                ? `<a class="contact-link" href="${phoneLink}" target="_blank">${phone}</a>`
                : "—"
            }
          </td>
          <td>
            ${
              email
                ? `<a class="contact-link" href="${emailLink}">${email}</a>`
                : "—"
            }
          </td>
          <td><span class="status-tag ${status}">${status}</span></td>
          <td>
            <div class="action-group">
              <button class="secondary-btn action-contacted" type="button">Mark Contacted</button>
              <button class="danger-btn action-closed" type="button">Close Request</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function formatDateTime(value) {
  if (!value) return "â€”";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "â€”";
  return date.toLocaleString();
}

function renderResponseRows(assignments) {
  if (!responsesBody) return;
  if (!Array.isArray(assignments) || assignments.length === 0) {
    responsesBody.innerHTML = `<tr><td colspan="5">No assignment responses yet.</td></tr>`;
    return;
  }

  responsesBody.innerHTML = assignments
    .map((assignment) => {
      const student = assignment.studentId || {};
      const course = assignment.courseId || {};
      const courseLabel =
        course.code || course.course_code || course.title || course.name || "General";
      const status = (assignment.status || "pending").toLowerCase();
      const respondedAt = formatDateTime(assignment.respondedAt);

      return `
        <tr>
          <td>${student.fullName || student.email || "â€”"}</td>
          <td>${courseLabel}</td>
          <td>${typeof assignment.score === "number" ? assignment.score : "â€”"}</td>
          <td><span class="status-tag ${status}">${status}</span></td>
          <td>${respondedAt}</td>
        </tr>
      `;
    })
    .join("");
}

async function fetchAssignments() {
  const token = getAdminToken();
  if (!token) {
    setStatus("Admin session missing. Please login again.", true);
    return;
  }

  setStatus("");
  setLoading(true);
  setEmpty(false);

  try {
    const [requestsRes, responsesRes] = await Promise.all([
      fetch(`${API_BASE}/api/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/api/assignments/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const requestsData = await requestsRes.json();
    if (!requestsRes.ok) {
      throw new Error(requestsData.message || "Failed to load assignment requests");
    }

    const responsesData = await responsesRes.json();
    if (!responsesRes.ok) {
      throw new Error(responsesData.message || "Failed to load assignment responses");
    }

    renderRows(requestsData);
    renderResponseRows(responsesData);
    setEmpty(!requestsData.length);
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Unable to load assignments.", true);
  } finally {
    setLoading(false);
  }
}

async function updateAssignmentStatus(id, status) {
  const token = getAdminToken();
  if (!token) {
    setStatus("Admin session missing. Please login again.", true);
    return;
  }

  setStatus("");
  try {
    const res = await fetch(`${API_BASE}/api/assignments/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to update assignment");
    }
    setStatus("Assignment updated.");
    await fetchAssignments();
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Unable to update assignment.", true);
  }
}

assignmentsBody?.addEventListener("click", (event) => {
  const row = event.target.closest("tr[data-id]");
  if (!row) return;
  const id = row.dataset.id;

  if (event.target.classList.contains("action-contacted")) {
    updateAssignmentStatus(id, "contacted");
  }

  if (event.target.classList.contains("action-closed")) {
    updateAssignmentStatus(id, "closed");
  }
});

refreshBtn?.addEventListener("click", fetchAssignments);

document.addEventListener("DOMContentLoaded", fetchAssignments);
