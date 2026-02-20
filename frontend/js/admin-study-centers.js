const token = (localStorage.getItem("adminToken") || localStorage.getItem("token"));

document.getElementById("centerForm").addEventListener("submit", async e => {
  e.preventDefault();

  const name = document.getElementById("centerName").value.trim();

  if (!name) {
    alert("Enter center name");
    return;
  }
await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/study-centers", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({
    name,
    state: "Lagos"
  })
});



  document.getElementById("centerName").value = "";

  loadCenters();
});

loadCenters();

async function loadCenters() {
  const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/study-centers");
  const data = await res.json();

  const list = document.getElementById("centerList");
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

async function deleteCenter(id) {
  await fetch((window.ISA_API_ORIGIN || "") + `/api/admin/study-centers/${id}`, {
  method: "DELETE",
  headers: {
    "Authorization": `Bearer ${token}`
  }
});

  loadCenters();
}

