const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "/frontend/pages/admin-login.html";
}

async function loadGallery() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/gallery", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const items = await res.json();
    if (!res.ok) return;

    const list = document.getElementById("galleryList");
    if (!list) return;

    list.innerHTML = items.map(g => {
      const createdBy = g.createdBy?.fullName || g.createdBy?.email || "—";
      const date = g.createdAt ? new Date(g.createdAt).toLocaleString() : "—";
      return `
        <div class="resource-item">
          <div class="resource-main">
            <strong>${g.caption || "(No caption)"}</strong>
            <div class="meta">${createdBy} · ${date}</div>
          </div>
          <div class="resource-action">
            <button class="action-btn" data-delete="${g._id}">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", () => deleteGallery(btn.dataset.delete));
    });
  } catch (err) {
    console.error(err);
  }
}

async function deleteGallery(id) {
  const ok = confirm("Delete this gallery item?");
  if (!ok) return;

  const res = await fetch(`http://localhost:5000/api/admin/gallery/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    alert("Failed to delete gallery item");
    return;
  }

  loadGallery();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("galleryForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const caption = document.getElementById("galleryCaption").value.trim();
    const fileInput = document.getElementById("galleryImage");
    const file = fileInput?.files?.[0];

    if (!file) {
      alert("Image is required");
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("image", file);

    try {
      const res = await fetch("http://localhost:5000/api/admin/gallery", {
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
      alert("Image uploaded");
      loadGallery();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  });

  loadGallery();
});
