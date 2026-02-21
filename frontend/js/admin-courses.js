const API_BASE = (window.ISA_API_ORIGIN || "") + "/api/admin/courses";

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("submitBtn")?.addEventListener("click", createCourse);
  loadCourses();
});

function setStatus(id, message, isError) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
}

function readFormValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wireAccordion(container) {
  container.querySelectorAll(".program-accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      const targetId = header.dataset.accordionTarget;
      if (!targetId) return;

      const panel = document.getElementById(targetId);
      if (!panel) return;

      const isOpening = panel.hidden;
      container.querySelectorAll(".program-accordion-panel").forEach((item) => {
        item.hidden = true;
      });
      container.querySelectorAll(".program-accordion-header").forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-expanded", "false");
      });

      if (isOpening) {
        panel.hidden = false;
        header.classList.add("active");
        header.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function renderCoursesAccordion(courses) {
  const tbody = document.getElementById("coursesTableBody");
  if (!tbody) return;

  const table = tbody.closest("table");
  const host = table?.parentElement;
  if (!table || !host) return;

  let accordion = document.getElementById("coursesAccordion");
  if (!accordion) {
    accordion = document.createElement("div");
    accordion.id = "coursesAccordion";
    accordion.className = "program-accordion";
    host.appendChild(accordion);
  }

  table.style.display = "none";

  if (!Array.isArray(courses) || courses.length === 0) {
    accordion.innerHTML = `<p class="status-text">No courses added yet.</p>`;
    return;
  }

  const grouped = courses.reduce((acc, course) => {
    const level = String(course.level || "Unknown");
    const semester = String(course.semester || "Unknown");
    const key = `${level} Level - ${semester}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {});

  const groupNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  accordion.innerHTML = groupNames
    .map((groupName, index) => {
      const panelId = `coursesPanel${index}`;
      const rows = grouped[groupName]
        .map((course) => `
          <tr>
            <td>${escapeHtml(course.courseCode)}</td>
            <td>${escapeHtml(course.title)}</td>
            <td>${escapeHtml(course.level)}</td>
            <td>${escapeHtml(course.units ?? "")}</td>
            <td>${escapeHtml(course.semester)}</td>
            <td>
              <button class="action-btn danger" data-delete="${escapeHtml(course._id)}">Delete</button>
            </td>
          </tr>
        `)
        .join("");

      return `
        <article class="program-accordion-item">
          <button type="button" class="program-accordion-header" data-accordion-target="${panelId}" aria-expanded="false">
            <span class="program-accordion-title">
              <span class="program-accordion-arrow">▶</span>
              <span>${escapeHtml(groupName)}</span>
            </span>
            <span class="program-accordion-count">(${grouped[groupName].length})</span>
          </button>
          <div id="${panelId}" class="program-accordion-panel" hidden>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Level</th>
                  <th>Units</th>
                  <th>Semester</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </article>
      `;
    })
    .join("");

  wireAccordion(accordion);

  accordion.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteCourse(btn.dataset.delete));
  });
}

async function createCourse() {
  const payload = {
    courseCode: readFormValue("courseCode"),
    title: readFormValue("courseTitle"),
    level: readFormValue("level"),
    semester: readFormValue("semester"),
    units: readFormValue("courseUnits")
  };

  if (
    !payload.courseCode ||
    !payload.title ||
    !payload.level ||
    !payload.semester ||
    !payload.units
  ) {
    setStatus("formStatus", "Please fill in all required fields.", true);
    return;
  }

  setStatus("formStatus", "Saving...");
  const { res, data } = await fetchJson(API_BASE, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    setStatus("formStatus", data.message || "Failed to save course", true);
    alert(data.message || "Failed to save course");
    return;
  }

  setStatus("formStatus", "Course saved");
  alert("Course uploaded successfully!");
  document.getElementById("courseForm")?.reset();
  loadCourses();
}

async function loadCourses() {
  setStatus("listStatus", "Loading...");
  const { res, data } = await fetchJson(API_BASE);
  if (!res.ok) {
    setStatus("listStatus", data.message || "Failed to load courses", true);
    return;
  }

  setStatus("listStatus", "");
  renderCoursesAccordion(data);
}

async function deleteCourse(id) {
  if (!id || !confirm("Delete this course?")) return;
  const { res, data } = await fetchJson(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    alert(data.message || "Delete failed");
    return;
  }
  loadCourses();
}

