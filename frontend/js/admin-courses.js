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
  const tbody = document.getElementById("coursesTableBody");
  if (!tbody) return;

  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">No courses added yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data
    .map((course) => {
      return `
        <tr>
          <td>${course.courseCode}</td>
          <td>${course.title}</td>
          <td>${course.level}</td>
          <td>${course.units ?? ""}</td>
          <td>${course.semester}</td>
          <td>
            <button class="action-btn danger" data-delete="${course._id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteCourse(btn.dataset.delete));
  });
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

