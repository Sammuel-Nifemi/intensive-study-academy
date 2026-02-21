function getAdminToken() {
  return (
    localStorage.getItem("adminToken") ||
    localStorage.getItem("staffToken") ||
    localStorage.getItem("token")
  );
}

async function fetchJson(url, options = {}) {
  const token = getAdminToken();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const baseHeaders = {
    Authorization: `Bearer ${token}`
  };
  if (!isFormData) {
    baseHeaders["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function loadFaculties(selectEl) {
  if (!selectEl) return;
  const { res, data } = await fetchJson((window.ISA_API_ORIGIN || "") + "/api/admin/faculties");
  if (!res.ok) return;
  selectEl.innerHTML = `<option value="">Select faculty</option>`;
  data.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.name;
    opt.textContent = f.name;
    selectEl.appendChild(opt);
  });
}

async function loadPrograms(selectEl) {
  if (!selectEl) return;
  const { res, data } = await fetchJson((window.ISA_API_ORIGIN || "") + "/api/admin/programs");
  if (!res.ok) return;
  selectEl.innerHTML = `<option value="">Select program</option>`;
  data.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p._id;
    opt.textContent = p.name;
    opt.dataset.faculty = p.faculty?.name || "";
    selectEl.appendChild(opt);
  });
}

function filterProgramsByFaculty(programSelect, facultyValue) {
  if (!programSelect) return;
  const options = Array.from(programSelect.options);
  options.forEach((opt) => {
    if (!opt.value) return;
    const match = !facultyValue || opt.dataset.faculty === facultyValue;
    opt.hidden = !match;
  });
}

