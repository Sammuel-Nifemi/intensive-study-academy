const API_BASE = (window.ISA_API_ORIGIN || "") + "/api/admin";

const state = {
  centers: [],
  faculties: [],
  programs: []
};

const centerSearch = document.getElementById("centerSearch");

document.addEventListener("DOMContentLoaded", async () => {
  bindActions();
  await loadStudyCenters();
  await loadFaculties();
  await loadPrograms();
});

function bindActions() {
  document.getElementById("addCenterBtn")?.addEventListener("click", createStudyCenter);
  document.getElementById("addFacultyBtn")?.addEventListener("click", createFaculty);
  document.getElementById("addProgramBtn")?.addEventListener("click", createProgram);

  centerSearch?.addEventListener("input", () => {
    renderStudyCenters(centerSearch.value);
  });

}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function setStatus(id, message, isError) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
  el.classList.toggle("success", Boolean(!isError && message));
}

async function loadStudyCenters() {
  const { res, data } = await fetchJson(`${API_BASE}/study-centers`);
  if (!res.ok) {
    console.error("Failed to load study centers", data);
    setStatus("centerStatus", data.message || "Failed to load study centers", true);
    return;
  }
  state.centers = Array.isArray(data) ? data : [];
  renderStudyCenters(centerSearch?.value || "");
}

function renderStudyCenters(searchTerm) {
  const tbody = document.getElementById("centersTableBody");
  if (!tbody) return;
  const term = String(searchTerm || "").toLowerCase();
  const filtered = state.centers.filter((c) => {
    const name = String(c.name || "").toLowerCase();
    const city = String(c.city || "").toLowerCase();
    return !term || name.includes(term) || city.includes(term);
  });

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3">No study centers found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (center) => `
      <tr>
        <td>${center.name}</td>
        <td>${center.city || "—"}</td>
        <td>
          <button class="action-btn danger" data-delete="${center._id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteStudyCenter(btn.dataset.delete));
  });
}

async function createStudyCenter() {
  const name = document.getElementById("centerName")?.value.trim();
  const city = document.getElementById("centerCity")?.value.trim();
  if (!name || !city) {
    setStatus("centerStatus", "Center name and city are required.", true);
    return;
  }

  setStatus("centerStatus", "Saving...");
  const { res, data } = await fetchJson(`${API_BASE}/study-centers`, {
    method: "POST",
    body: JSON.stringify({ name, city })
  });

  if (!res.ok) {
    setStatus("centerStatus", data.message || "Failed to save center", true);
    showToast(data.message || "Failed to save center", "error");
    return;
  }

  setStatus("centerStatus", "Saved");
  showToast("Study center added");
  document.getElementById("studyCenterForm")?.reset();
  await loadStudyCenters();
}

async function deleteStudyCenter(id) {
  if (!id || !confirm("Delete this study center?")) return;
  const { res, data } = await fetchJson(`${API_BASE}/study-centers/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    showToast(data.message || "Delete failed", "error");
    return;
  }
  showToast("Study center deleted");
  await loadStudyCenters();
}

async function loadFaculties() {
  const { res, data } = await fetchJson(`${API_BASE}/faculties`);
  if (!res.ok) {
    console.error("Failed to load faculties", data);
    setStatus("facultyStatus", data.message || "Failed to load faculties", true);
    return;
  }
  state.faculties = Array.isArray(data) ? data : [];
  renderFaculties();
  hydrateFacultySelects();
}

function renderFaculties() {
  const tbody = document.getElementById("facultiesTableBody");
  if (!tbody) return;
  if (!state.faculties.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2">No faculties found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.faculties
    .map(
      (faculty) => `
      <tr>
        <td>${faculty.name}</td>
        <td>
          <button class="action-btn danger" data-delete="${faculty._id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteFaculty(btn.dataset.delete));
  });
}

function hydrateFacultySelects() {
  const programFacultySelect = document.getElementById("programFacultySelect");
  if (!programFacultySelect) return;
  programFacultySelect.innerHTML = `<option value="">Select faculty</option>`;
  state.faculties.forEach((faculty) => {
    const opt = document.createElement("option");
    opt.value = faculty._id;
    opt.textContent = faculty.name;
    programFacultySelect.appendChild(opt);
  });
}

async function createFaculty() {
  const name = document.getElementById("facultyName")?.value.trim();
  if (!name) {
    setStatus("facultyStatus", "Faculty name is required.", true);
    return;
  }

  setStatus("facultyStatus", "Saving...");
  const { res, data } = await fetchJson(`${API_BASE}/faculties`, {
    method: "POST",
    body: JSON.stringify({ name })
  });

  if (!res.ok) {
    setStatus("facultyStatus", data.message || "Failed to save faculty", true);
    showToast(data.message || "Failed to save faculty", "error");
    return;
  }

  setStatus("facultyStatus", "Saved");
  showToast("Faculty added");
  document.getElementById("facultyForm")?.reset();
  await loadFaculties();
  await loadPrograms();
}

async function deleteFaculty(id) {
  if (!id || !confirm("Delete this faculty?")) return;
  const { res, data } = await fetchJson(`${API_BASE}/faculties/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    showToast(data.message || "Delete failed", "error");
    return;
  }
  showToast("Faculty deleted");
  await loadFaculties();
  await loadPrograms();
}

async function loadPrograms() {
  const { res, data } = await fetchJson(`${API_BASE}/programs`);
  if (!res.ok) {
    console.error("Failed to load programs", data);
    setStatus("programStatus", data.message || "Failed to load programs", true);
    return;
  }
  state.programs = Array.isArray(data) ? data : [];
  renderPrograms();
  hydrateProgramSelects();
}

function renderPrograms() {
  const tbody = document.getElementById("programsTableBody");
  if (!tbody) return;
  if (!state.programs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3">No programs found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.programs
    .map(
      (program) => `
      <tr>
        <td>${program.name}</td>
        <td>${program.facultyName || "—"}</td>
        <td>
          <button class="action-btn danger" data-delete="${program._id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteProgram(btn.dataset.delete));
  });
}

function hydrateProgramSelects() {
  return;
}

async function createProgram() {
  const facultyId = document.getElementById("programFacultySelect")?.value;
  const name = document.getElementById("programName")?.value.trim();
  if (!facultyId || !name) {
    setStatus("programStatus", "Faculty and program name are required.", true);
    return;
  }

  setStatus("programStatus", "Saving...");
  const { res, data } = await fetchJson(`${API_BASE}/programs`, {
    method: "POST",
    body: JSON.stringify({ facultyId, name })
  });

  if (!res.ok) {
    setStatus("programStatus", data.message || "Failed to save program", true);
    showToast(data.message || "Failed to save program", "error");
    return;
  }

  setStatus("programStatus", "Saved");
  showToast("Program added");
  document.getElementById("programForm")?.reset();
  await loadPrograms();
}

async function deleteProgram(id) {
  if (!id || !confirm("Delete this program?")) return;
  const { res, data } = await fetchJson(`${API_BASE}/programs/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    showToast(data.message || "Delete failed", "error");
    return;
  }
  showToast("Program deleted");
  await loadPrograms();
}
