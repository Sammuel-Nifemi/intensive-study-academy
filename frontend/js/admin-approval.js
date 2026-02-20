
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("adminToken");
  const list = document.getElementById("pendingList");

  const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/materials/pending", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const materials = await res.json();

  if (!materials.length) {
    list.textContent = "No pending materials.";
    return;
  }

  list.innerHTML = materials.map(m => `
    <div style="border:1px solid #ccc; padding:10px; margin:10px 0">
      <strong>${m.courseCode}</strong> (${m.resourceType})<br/>
      Session: ${m.session} | Semester: ${m.semester}<br/>
      <button onclick="approve('${m._id}')">Approve</button>
    </div>
  `).join("");
});

async function approve(id) {
  const token = localStorage.getItem("adminToken");

  await fetch((window.ISA_API_ORIGIN || "") + `/api/materials/${id}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });

  alert("Approved");
  location.reload();
}
