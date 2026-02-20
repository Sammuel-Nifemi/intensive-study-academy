const facultySelect = document.getElementById("facultySelect");
const programList = document.getElementById("programList");
const btn = document.getElementById("addBtn");

async function loadFaculties() {
  const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/faculties");
  const data = await res.json();

  facultySelect.innerHTML = "";

  data.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f._id;
    opt.textContent = f.name;
    facultySelect.appendChild(opt);
  });
}

async function loadPrograms() {
  const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/programs");
  const data = await res.json();

  programList.innerHTML = "";

  data.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `${p.name} (${p.faculty?.name || ""}) 
      <button onclick="deleteProgram('${p._id}')">âŒ</button>`;
    programList.appendChild(li);
  });
}

btn.onclick = async () => {
  const name = document.getElementById("programName").value;
  const faculty = facultySelect.value;

  await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/programs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, faculty })
  });

  document.getElementById("programName").value = "";
  loadPrograms();
};

async function deleteProgram(id) {
  await fetch((window.ISA_API_ORIGIN || "") + `/api/admin/programs/${id}`, {
    method: "DELETE"
  });
  loadPrograms();
}

loadFaculties();
loadPrograms();
