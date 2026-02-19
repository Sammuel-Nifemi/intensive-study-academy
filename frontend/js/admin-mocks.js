const API_BASE = "http://localhost:5000/api/admin/mocks";

const facultySelect = document.getElementById("facultySelect");
const programSelect = document.getElementById("programSelect");
const filterFaculty = document.getElementById("filterFaculty");
const filterProgram = document.getElementById("filterProgram");

document.addEventListener("DOMContentLoaded", async () => {
  await loadFaculties(facultySelect);
  await loadPrograms(programSelect);
  await loadFaculties(filterFaculty);
  await loadPrograms(filterProgram);

  facultySelect?.addEventListener("change", () => {
    filterProgramsByFaculty(programSelect, facultySelect.value);
  });

  filterFaculty?.addEventListener("change", () => {
    filterProgramsByFaculty(filterProgram, filterFaculty.value);
  });

  document.getElementById("uploadBtn")?.addEventListener("click", uploadMocks);
  document.getElementById("filterBtn")?.addEventListener("click", loadMocks);
  document.getElementById("resetBtn")?.addEventListener("click", resetFilters);

  loadMocks();
});

function setStatus(id, message, isError) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
}

async function uploadMocks() {
  const files = document.getElementById("files")?.files;
  if (!files || !files.length) {
    setStatus("uploadStatus", "Please select at least one PDF.", true);
    return;
  }

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("faculty", facultySelect.value);
  formData.append("program", programSelect.value);
  formData.append("level", document.getElementById("level").value);
  formData.append("semester", document.getElementById("semester").value);
  formData.append("courseCode", document.getElementById("courseCode").value);
  Array.from(files).forEach((file) => formData.append("files", file));

  setStatus("uploadStatus", "Uploading...");
  const { res, data } = await fetchJson(API_BASE, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    setStatus("uploadStatus", data.message || "Upload failed", true);
    return;
  }

  setStatus("uploadStatus", "Upload successful");
  document.getElementById("mockForm")?.reset();
  loadMocks();
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

async function loadMocks() {
  setStatus("listStatus", "Loading...");
  const { res, data } = await fetchJson(`${API_BASE}${buildQuery()}`);
  if (!res.ok) {
    setStatus("listStatus", data.message || "Failed to load mocks", true);
    return;
  }

  setStatus("listStatus", "");
  const tbody = document.getElementById("mocksTableBody");
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
  if (!id || !confirm("Delete this mock exam?")) return;
  const { res, data } = await fetchJson(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    alert(data.message || "Delete failed");
    return;
  }
  loadMocks();
}

async function editItem(id) {
  const title = prompt("New title (leave blank to keep current):");
  const payload = {};
  if (title) payload.title = title;
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
  loadMocks();
}

function resetFilters() {
  document.getElementById("filterForm")?.reset();
  loadMocks();
}
