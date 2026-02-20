const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "./admin-login.html";
}

let editingAnnouncementId = null;
let announcementCache = [];

async function loadAnnouncements() {
  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/announcements", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const items = await res.json();
    if (!res.ok) return;

    announcementCache = items;

    const list = document.getElementById("announcementsList");
    if (!list) return;

    list.innerHTML = items.map(a => {
      const createdBy = a.createdBy?.fullName || a.createdBy?.email || "�";
      const date = a.createdAt ? new Date(a.createdAt).toLocaleString() : "�";
      return `
        <div class="resource-item">
          <div class="resource-main">
            <strong>${a.title || "Untitled"}</strong>
            <div class="meta">${createdBy} � ${date}</div>
          </div>
          <div class="resource-action">
            <button class="action-btn" data-edit="${a._id}">Edit</button>
            <button class="action-btn" data-delete="${a._id}">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.edit));
    });

    list.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", () => deleteAnnouncement(btn.dataset.delete));
    });
  } catch (err) {
    console.error(err);
  }
}

function openEditModal(id) {
  const modal = document.getElementById("announcementEditModal");
  const title = document.getElementById("editAnnouncementTitle");
  const message = document.getElementById("editAnnouncementMessage");
  const target = document.getElementById("editAnnouncementTarget");
  const item = announcementCache.find(i => i._id === id);

  if (!item || !modal || !title || !message || !target) return;

  editingAnnouncementId = id;
  title.value = item.title || "";
  message.value = item.message || "";
  target.value = item.target || "all";
  modal.classList.remove("hidden");
}

async function saveAnnouncement() {
  if (!editingAnnouncementId) return;
  const title = document.getElementById("editAnnouncementTitle").value.trim();
  const message = document.getElementById("editAnnouncementMessage").value.trim();
  const target = document.getElementById("editAnnouncementTarget").value;

  const res = await fetch((window.ISA_API_ORIGIN || "") + `/api/admin/announcements/${editingAnnouncementId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, message, target })
  });

  if (!res.ok) {
    alert("Failed to update announcement");
    return;
  }

  closeAnnouncementModal();
  loadAnnouncements();
}

async function deleteAnnouncement(id) {
  const ok = confirm("Delete this announcement?");
  if (!ok) return;

  const res = await fetch((window.ISA_API_ORIGIN || "") + `/api/admin/announcements/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    alert("Failed to delete announcement");
    return;
  }

  loadAnnouncements();
}

function closeAnnouncementModal() {
  const modal = document.getElementById("announcementEditModal");
  if (modal) modal.classList.add("hidden");
  editingAnnouncementId = null;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("announcementForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("announcementTitle").value.trim();
    const message = document.getElementById("announcementMessage").value.trim();
    const target = document.getElementById("announcementTarget").value;

    if (!title || !message) {
      alert("Title and message are required");
      return;
    }

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, message, target })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to publish");
        return;
      }

      form.reset();
      alert("Announcement published");
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      alert("Failed to publish");
    }
  });

  document.getElementById("saveAnnouncementBtn")?.addEventListener("click", saveAnnouncement);
  document.getElementById("closeAnnouncementModal")?.addEventListener("click", closeAnnouncementModal);

  loadAnnouncements();
});
