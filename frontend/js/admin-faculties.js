
const token = localStorage.getItem("adminToken");
const list = document.getElementById("facultyList");

async function loadFaculties() {
  const res = await fetch("http://localhost:5000/api/admin/faculties", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  list.innerHTML = data.map(f => `<li>${f.name}</li>`).join("");
}

document.getElementById("facultyForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = facultyName.value;

  await fetch("http://localhost:5000/api/admin/faculties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });

  facultyName.value = "";
  loadFaculties();
});

loadFaculties();
