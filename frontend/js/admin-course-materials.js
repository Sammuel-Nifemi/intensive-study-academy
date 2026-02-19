

async function fetchJson(url, options = {}) {
  const token = localStorage.getItem("adminToken");

  options.headers = options.headers || {};

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

const API_BASE = "http://localhost:5000/api/admin/course-materials";
const COURSES_API = "http://localhost:5000/api/admin/public/courses";

const facultySelect = document.getElementById("facultySelect");
const programSelect = document.getElementById("programSelect");
const courseSelect = document.getElementById("courseSelect");
const filterFaculty = document.getElementById("filterFaculty");
const filterProgram = document.getElementById("filterProgram");

document.addEventListener("DOMContentLoaded", async () => {
  await loadFaculties(facultySelect);
  await loadPrograms(programSelect);
  await loadFaculties(filterFaculty);
  await loadPrograms(filterProgram);
  await loadCourses(courseSelect);

  facultySelect?.addEventListener("change", () => {
    filterProgramsByFaculty(programSelect, facultySelect.value);
  });

  filterFaculty?.addEventListener("change", () => {
    filterProgramsByFaculty(filterProgram, filterFaculty.value);
  });

  document.getElementById("uploadBtn")?.addEventListener("click", uploadMaterials);
  document.getElementById("filterBtn")?.addEventListener("click", loadMaterials);
  document.getElementById("resetBtn")?.addEventListener("click", resetFilters);

  loadMaterials();
});

function setStatus(id, message, isError, isLoading, isSuccess) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
  el.classList.toggle("loading", Boolean(isLoading));
  el.classList.toggle("success", Boolean(isSuccess));

  if (id === "uploadStatus") {
    const progress = document.getElementById("uploadProgress");
    if (progress) {
      progress.classList.toggle("loading", Boolean(isLoading));
    }
  }
}

async function loadCourses(selectEl) {
  if (!selectEl) return;
  try {
    const { res, data } = await fetchJson(COURSES_API);
    if (!res.ok) {
      selectEl.innerHTML = `<option value="">Unable to load courses</option>`;
      console.error("Failed to load courses", data);
      return;
    }
    if (!Array.isArray(data) || data.length === 0) {
      selectEl.innerHTML = `<option value="">No courses found</option>`;
      return;
    }
    selectEl.innerHTML = `<option value="">Select course</option>`;
    data.forEach((course) => {
      const opt = document.createElement("option");
      opt.value = course.courseCode;
      const displayName = course.name || course.title || "Untitled Course";
      opt.textContent = `${course.courseCode} - ${displayName}`;
      selectEl.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load courses", err);
    selectEl.innerHTML = `<option value="">Unable to load courses</option>`;
  }
}

async function uploadMaterials() {
  const files = document.getElementById("files")?.files;
  if (!files || !files.length) {
    setStatus("uploadStatus", "Please select at least one PDF.", true, false, false);
    return;
  }

  if (!courseSelect?.value) {
    setStatus("uploadStatus", "Please select a course.", true, false, false);
    return;
  }

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("faculty", facultySelect.value);
  formData.append("program", programSelect.value);
  formData.append("level", document.getElementById("level").value);
  formData.append("semester", document.getElementById("semester").value);
  formData.append("courseCode", courseSelect.value);

  Array.from(files).forEach((file) => formData.append("files", file));

  setStatus("uploadStatus", "Uploading...", false, true, false);
  const { res, data } = await fetchJson(API_BASE, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    setStatus("uploadStatus", data.message || "Upload failed", true, false, false);
    return;
  }

  setStatus("uploadStatus", "Upload successful", false, false, true);
  setTimeout(() => {
    setStatus("uploadStatus", "");
  }, 2000);
  document.getElementById("materialForm")?.reset();
  if (courseSelect) {
    courseSelect.selectedIndex = 0;
  }
  loadMaterials();
}

function buildQuery() {
  const params = new URLSearchParams();
  if (filterFaculty?.value) params.set("faculty", filterFaculty.value);
  if (filterProgram?.value) params.set("program", filterProgram.value);
  if (document.getElementById("filterLevel")?.value) {
    params.set("level", document.getElementById("filterLevel").value);
  }
  if (document.getElementById("filterSemester")?.value) {
    params.set("semester", document.getElementById("filterSemester").value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function loadMaterials() {
  setStatus("listStatus", "Loading...", false, true, false);
  const { res, data } = await fetchJson(`${API_BASE}${buildQuery()}`);
  if (!res.ok) {
    setStatus("listStatus", data.message || "Failed to load materials", true, false, false);
    return;
  }

  setStatus("listStatus", "", false, false, false);
  const tbody = document.getElementById("materialsTableBody");
  if (!tbody) return;
  tbody.innerHTML = data
    .map((item) => {
      return `
        <tr>
          <td>${item.title}</td>
          <td>${item.program?.name || item.program}</td>
          <td>${item.level}</td>
          <td>${item.semester}</td>
          <td><a href="${item.fileUrl}" target="_blank">Download</a></td>
          <td>
            <button class="action-btn" data-edit="${item._id}">Edit</button>
            <button class="action-btn danger" data-delete="${item._id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteItem(btn.dataset.delete));
  });
  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => editItem(btn.dataset.edit));
  });
}

async function deleteItem(id) {
  if (!id || !confirm("Delete this material?")) return;
  const { res, data } = await fetchJson(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    alert(data.message || "Delete failed");
    return;
  }
  loadMaterials();
}

async function editItem(id) {
  const title = prompt("New title (leave blank to keep current):");
  const description = prompt("New description (leave blank to keep current):");
  const payload = {};
  if (title) payload.title = title;
  if (description) payload.description = description;
  if (!Object.keys(payload).length) return;

  const { res, data } = await fetchJson(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert(data.message || "Update failed");
    return;
  }
  loadMaterials();
}

function resetFilters() {
  document.getElementById("filterForm")?.reset();
  loadMaterials();
}
