const API_BASE = (window.ISA_API_ORIGIN || "") + "/api/admin/fee-structures";

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

  document.getElementById("createBtn")?.addEventListener("click", createFeeStructure);
  document.getElementById("filterBtn")?.addEventListener("click", loadFeeStructures);
  document.getElementById("resetBtn")?.addEventListener("click", resetFilters);

  loadFeeStructures();
});

function setStatus(id, message, isError) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
}

async function createFeeStructure() {
  const payload = {
    faculty: facultySelect.value,
    program: programSelect.value,
    level: document.getElementById("level").value,
    semester: document.getElementById("semester").value,
    perCourseFee: Number(document.getElementById("perCourseFee").value || 0),
    perExamFee: Number(document.getElementById("perExamFee").value || 0),
    otherFees: document.getElementById("otherFees").value
  };

  setStatus("createStatus", "Saving...");
  const { res, data } = await fetchJson(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    setStatus("createStatus", data.message || "Save failed", true);
    return;
  }

  setStatus("createStatus", "Saved");
  document.getElementById("feeForm")?.reset();
  loadFeeStructures();
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

async function loadFeeStructures() {
  setStatus("listStatus", "Loading...");
  const { res, data } = await fetchJson(`${API_BASE}${buildQuery()}`);
  if (!res.ok) {
    setStatus("listStatus", data.message || "Failed to load fees", true);
    return;
  }

  setStatus("listStatus", "");
  const tbody = document.getElementById("feesTableBody");
  if (!tbody) return;
  tbody.innerHTML = data
    .map((item) => {
      return `
        <tr>
          <td>${item.faculty}</td>
          <td>${item.program?.name || item.program}</td>
          <td>${item.level}</td>
          <td>${item.semester}</td>
          <td>${item.perCourseFee ?? ""}</td>
          <td>${item.perExamFee ?? ""}</td>
          <td>${item.otherFees ? JSON.stringify(item.otherFees) : "{}"}</td>
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
  if (!id || !confirm("Delete this fee structure?")) return;
  const { res, data } = await fetchJson(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    alert(data.message || "Delete failed");
    return;
  }
  loadFeeStructures();
}

async function editItem(id) {
  const perCourseFee = prompt("New course fee (leave blank to keep current):");
  const perExamFee = prompt("New exam fee (leave blank to keep current):");
  const otherFees = prompt("Other fees JSON (leave blank to keep current):");

  const payload = {};
  if (perCourseFee !== null && perCourseFee !== "") payload.perCourseFee = Number(perCourseFee);
  if (perExamFee !== null && perExamFee !== "") payload.perExamFee = Number(perExamFee);
  if (otherFees) payload.otherFees = otherFees;

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
  loadFeeStructures();
}

function resetFilters() {
  document.getElementById("filterForm")?.reset();
  loadFeeStructures();
}
