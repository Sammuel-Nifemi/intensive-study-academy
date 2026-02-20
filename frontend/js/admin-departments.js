const token = localStorage.getItem("adminToken");

async function loadFaculties() {
  const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/faculties", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const faculties = await res.json();
  facultySelect.innerHTML = faculties.map(f =>
    `<option value="${f._id}">${f.name}</option>`
  );
}

document.getElementById("deptForm").addEventListener("submit", async e => {
  e.preventDefault();

  await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/departments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: deptName.value,
      faculty: facultySelect.value
    })
  });

  deptName.value = "";
});

loadFaculties();

