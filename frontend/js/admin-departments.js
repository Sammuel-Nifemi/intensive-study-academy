const token = localStorage.getItem("adminToken");

async function loadFaculties() {
  const res = await fetch("http://localhost:5000/api/admin/faculties", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const faculties = await res.json();
  facultySelect.innerHTML = faculties.map(f =>
    `<option value="${f._id}">${f.name}</option>`
  );
}

document.getElementById("deptForm").addEventListener("submit", async e => {
  e.preventDefault();

  await fetch("http://localhost:5000/api/admin/departments", {
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

