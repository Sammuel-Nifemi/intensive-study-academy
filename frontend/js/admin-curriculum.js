const API_BASE = (window.ISA_API_ORIGIN || "") + "/api/admin/program-courses";
const COURSE_API = (window.ISA_API_ORIGIN || "") + "/api/admin/courses";

const courseSelect = document.getElementById("courseSelect");
const programSelect = document.getElementById("programSelect");

document.addEventListener("DOMContentLoaded", async () => {
  await loadCourses();
  await loadPrograms(programSelect);
  document.getElementById("assignBtn")?.addEventListener("click", assignCourse);
  loadProgramCourses();
});

function setStatus(id, message, isError) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
}

function escapeHtml(value) {
  return String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadCourses() {
  if (!courseSelect) return;
  const { res, data } = await fetchJson(COURSE_API);
  if (!res.ok) return;
  courseSelect.innerHTML = `<option value="">Select course</option>`;
  data.forEach((course) => {
    const opt = document.createElement("option");
    opt.value = course.courseCode;
    opt.textContent = `${course.courseCode} - ${course.title}`;
    courseSelect.appendChild(opt);
  });
}

function readValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

async function assignCourse() {
  const payload = {
    courseCode: courseSelect?.value || "",
    program: programSelect?.value || "",
    level: readValue("levelInput"),
    semester: readValue("semesterSelect"),
    category: readValue("categorySelect")
  };

  if (
    !payload.courseCode ||
    !payload.program ||
    !payload.level ||
    !payload.semester ||
    !payload.category
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
    setStatus("formStatus", data.message || "Failed to assign course", true);
    return;
  }

  setStatus("formStatus", "Course assigned.");
  document.getElementById("curriculumForm")?.reset();
  loadProgramCourses();
}

async function loadProgramCourses() {
  setStatus("listStatus", "Loading...");
  const { res, data } = await fetchJson(API_BASE);
  if (!res.ok) {
    setStatus("listStatus", data.message || "Failed to load program courses", true);
    return;
  }

  setStatus("listStatus", "");
  const container = document.getElementById("programCoursesAccordion");
  if (!container) return;

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `<p class="status-text">No program courses assigned yet.</p>`;
    return;
  }

  const grouped = data.reduce((acc, item) => {
    const programName = item.program?.name || "Unknown Program";
    if (!acc[programName]) acc[programName] = [];
    acc[programName].push(item);
    return acc;
  }, {});

  const programNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  container.innerHTML = programNames
    .map((programName, index) => {
      const panelId = `programPanel${index}`;
      const rows = grouped[programName]
        .map((item) => {
          return `
            <tr>
              <td>${escapeHtml(item.courseCode)}</td>
              <td>${escapeHtml(item.course?.title)}</td>
              <td>${escapeHtml(item.level)}</td>
              <td>${escapeHtml(item.semester)}</td>
              <td>${escapeHtml(item.category)}</td>
              <td>
                <button class="action-btn danger" data-delete="${escapeHtml(item._id)}">Delete</button>
              </td>
            </tr>
          `;
        })
        .join("");

      return `
        <article class="program-accordion-item">
          <button type="button" class="program-accordion-header" data-accordion-target="${panelId}" aria-expanded="false">
            <span class="program-accordion-title">
              <span class="program-accordion-arrow">▶</span>
              <span>${escapeHtml(programName)}</span>
            </span>
            <span class="program-accordion-count">(${grouped[programName].length})</span>
          </button>

          <div id="${panelId}" class="program-accordion-panel" hidden>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Level</th>
                  <th>Semester</th>
                  <th>Category</th>
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

  container.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteProgramCourse(btn.dataset.delete));
  });
}

async function deleteProgramCourse(id) {
  if (!id || !confirm("Delete this assignment?")) return;
  const { res, data } = await fetchJson(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    alert(data.message || "Delete failed");
    return;
  }
  loadProgramCourses();
}
