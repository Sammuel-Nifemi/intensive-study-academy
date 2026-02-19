const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "/frontend/pages/admin-login.html";
}

let editingMaterialId = null;

async function loadMaterials() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/materials", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const items = await res.json();
    if (!res.ok) return;

    const list = document.getElementById("materialsList");
    if (!list) return;

    list.innerHTML = items.map((m) => {
      const createdBy = m.createdBy?.fullName || m.createdBy?.email || "-";
      const date = m.createdAt ? new Date(m.createdAt).toLocaleString() : "-";
      return `
        <div class="resource-item">
          <div class="resource-main">
            <strong>${m.title || "Untitled"}</strong>
            <div class="meta">${m.courseCode || "General"} - ${createdBy} - ${date}</div>
          </div>
          <div class="resource-action">
            <button class="action-btn" data-edit="${m._id}">Edit</button>
            <button class="action-btn" data-delete="${m._id}">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.edit, items));
    });

    list.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => deleteMaterial(btn.dataset.delete));
    });
  } catch (err) {
    console.error(err);
  }
}

function openEditModal(id, items) {
  const modal = document.getElementById("materialEditModal");
  const title = document.getElementById("editMaterialTitle");
  const description = document.getElementById("editMaterialDescription");
  const course = document.getElementById("editMaterialCourse");
  const item = items.find((i) => i._id === id);

  if (!item || !modal || !title || !description || !course) return;

  editingMaterialId = id;
  title.value = item.title || "";
  description.value = item.description || "";
  course.value = item.courseCode || "";
  modal.classList.remove("hidden");
}

async function saveMaterial() {
  if (!editingMaterialId) return;

  const title = document.getElementById("editMaterialTitle").value.trim();
  const description = document.getElementById("editMaterialDescription").value.trim();
  const courseCode = document.getElementById("editMaterialCourse").value.trim();

  if (!title || !description) {
    alert("Title and description are required");
    return;
  }

  const res = await fetch(`http://localhost:5000/api/admin/materials/${editingMaterialId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, description, courseCode })
  });

  if (!res.ok) {
    alert("Failed to update material");
    return;
  }

  closeMaterialModal();
  loadMaterials();
}

async function deleteMaterial(id) {
  const ok = confirm("Delete this material?");
  if (!ok) return;

  const res = await fetch(`http://localhost:5000/api/admin/materials/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    alert("Failed to delete material");
    return;
  }

  loadMaterials();
}

function closeMaterialModal() {
  const modal = document.getElementById("materialEditModal");
  if (modal) modal.classList.add("hidden");
  editingMaterialId = null;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("materialForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("materialTitle").value.trim();
    const description = document.getElementById("materialDescription").value.trim();
    const courseCode = document.getElementById("courseCode").value.trim();
    const fileInput = document.getElementById("materialFile");
    const file = fileInput?.files?.[0];

    if (!title || !description || !file) {
      alert("Title, description, and file are required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("courseCode", courseCode);
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/api/admin/materials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Upload failed");
        return;
      }

      form.reset();
      alert("Material uploaded");
      loadMaterials();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  });

  document.getElementById("saveMaterialBtn")?.addEventListener("click", saveMaterial);
  document.getElementById("closeMaterialModal")?.addEventListener("click", closeMaterialModal);

  loadMaterials();
});