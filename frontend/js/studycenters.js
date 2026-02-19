const btn = document.getElementById("addBtn");
const list = document.getElementById("centerList");

async function loadCenters() {
  const res = await fetch("http://localhost:5000/api/admin/study-centers");
  const data = await res.json();

  list.innerHTML = "";

  data.forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${c.name}
      <button onclick="deleteCenter('${c._id}')">❌</button>
    `;
    list.appendChild(li);
  });
}

btn.onclick = async () => {
  const name = document.getElementById("centerName").value;

  if (!name) return alert("Enter name");

  await fetch("http://localhost:5000/api/admin/study-centers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  document.getElementById("centerName").value = "";
  loadCenters();
};

async function deleteCenter(id) {
  await fetch(`http://localhost:5000/api/admin/study-centers/${id}`, {
    method: "DELETE"
  });

  loadCenters();
}

loadCenters();
