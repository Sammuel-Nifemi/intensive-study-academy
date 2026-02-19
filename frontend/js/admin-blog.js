const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "/frontend/pages/admin-login.html";
}

let editingBlogId = null;
let blogCache = [];

async function loadBlogs() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/blog", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const items = await res.json();
    if (!res.ok) return;

    blogCache = items;

    const list = document.getElementById("blogList");
    if (!list) return;

    list.innerHTML = items.map(b => {
      const createdBy = b.createdBy?.fullName || b.createdBy?.email || "—";
      const date = b.createdAt ? new Date(b.createdAt).toLocaleString() : "—";
      return `
        <div class="resource-item">
          <div class="resource-main">
            <strong>${b.title || "Untitled"}</strong>
            <div class="meta">${createdBy} · ${date}</div>
          </div>
          <div class="resource-action">
            <button class="action-btn" data-edit="${b._id}">Edit</button>
            <button class="action-btn" data-delete="${b._id}">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.edit));
    });

    list.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", () => deleteBlog(btn.dataset.delete));
    });
  } catch (err) {
    console.error(err);
  }
}

function openEditModal(id) {
  const modal = document.getElementById("blogEditModal");
  const title = document.getElementById("editBlogTitle");
  const content = document.getElementById("editBlogContent");
  const item = blogCache.find(i => i._id === id);

  if (!item || !modal || !title || !content) return;

  editingBlogId = id;
  title.value = item.title || "";
  content.value = item.content || "";
  modal.classList.remove("hidden");
}

async function saveBlog() {
  if (!editingBlogId) return;
  const title = document.getElementById("editBlogTitle").value.trim();
  const content = document.getElementById("editBlogContent").value.trim();

  const res = await fetch(`http://localhost:5000/api/admin/blog/${editingBlogId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  });

  if (!res.ok) {
    alert("Failed to update blog post");
    return;
  }

  closeBlogModal();
  loadBlogs();
}

async function deleteBlog(id) {
  const ok = confirm("Delete this blog post?");
  if (!ok) return;

  const res = await fetch(`http://localhost:5000/api/admin/blog/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    alert("Failed to delete blog post");
    return;
  }

  loadBlogs();
}

function closeBlogModal() {
  const modal = document.getElementById("blogEditModal");
  if (modal) modal.classList.add("hidden");
  editingBlogId = null;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("blogForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("blogTitle").value.trim();
    const content = document.getElementById("blogContent").value.trim();
    const fileInput = document.getElementById("blogCover");
    const file = fileInput?.files?.[0];

    if (!title || !content) {
      alert("Title and content are required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (file) formData.append("coverImage", file);

    try {
      const res = await fetch("http://localhost:5000/api/admin/blog", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to publish");
        return;
      }

      form.reset();
      alert("Blog post published");
      loadBlogs();
    } catch (err) {
      console.error(err);
      alert("Failed to publish");
    }
  });

  document.getElementById("saveBlogBtn")?.addEventListener("click", saveBlog);
  document.getElementById("closeBlogModal")?.addEventListener("click", closeBlogModal);

  loadBlogs();
});
