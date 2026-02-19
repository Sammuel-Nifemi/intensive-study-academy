const list = document.getElementById("facultyList");
const btn = document.getElementById("addBtn");

async function loadFaculties() {
  const res = await fetch("http://localhost:5000/api/admin/faculties");
  const data = await res.json();

  list.innerHTML = "";

  data.forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${f.name}
      <button onclick="del('${f._id}')">❌</button>
    `;
    list.appendChild(li);
  });
}

btn.onclick = async () => {
  const name = document.getElementById("facultyName").value.trim();
console.log("Sending:", name);

  if (!name) {
    alert("Enter faculty name");
    return;
  }

  await fetch("http://localhost:5000/api/admin/faculties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  });

  document.getElementById("facultyName").value = "";

  loadFaculties();
};
