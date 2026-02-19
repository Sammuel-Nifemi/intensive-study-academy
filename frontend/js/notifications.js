function getNotificationToken() {
  return window.NOTIFICATION_TOKEN || null;
}

function getTypeIcon(type) {
  const map = {
    announcement: "📢",
    material: "📚",
    complaint: "⚠️",
    "birthday-reminder": "🎂",
    "birthday-today": "🎉"
  };
  return map[type] || "🔔";
}

function renderNotifications(dropdown, notifications) {
  if (!dropdown) return;
  dropdown.innerHTML = "";

  if (!notifications.length) {
    const empty = document.createElement("div");
    empty.className = "notification-empty";
    empty.textContent = "No notifications yet.";
    dropdown.appendChild(empty);
    return;
  }

  notifications.forEach((n) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `notification-item${n.isRead ? " read" : ""}`;
    item.dataset.id = n._id;
    item.innerHTML = `
      <span class="notification-icon">${getTypeIcon(n.type)}</span>
      <span class="notification-content">
        <strong>${n.title}</strong>
        <span>${n.message}</span>
      </span>
    `;
    dropdown.appendChild(item);
  });
}

async function fetchNotifications() {
  const token = getNotificationToken();
  if (!token) return [];

  const res = await fetch("http://localhost:5000/api/notifications", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) return [];
  return payload.data || [];
}

function updateBadge(badge, notifications) {
  if (!badge) return;
  const unread = notifications.filter((n) => !n.isRead).length;
  if (unread > 0) {
    badge.hidden = false;
    badge.textContent = String(unread);
  } else {
    badge.hidden = true;
    badge.textContent = "0";
  }
}

async function markRead(id) {
  const token = getNotificationToken();
  if (!token || !id) return null;
  const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) return null;
  return payload.data;
}

document.addEventListener("DOMContentLoaded", async () => {
  const bell = document.getElementById("notificationBell");
  const badge = document.getElementById("notificationBadge");
  const dropdown = document.getElementById("notificationDropdown");
  if (!bell || !dropdown) return;

  const notifications = await fetchNotifications();
  const sorted = notifications.sort((a, b) => Number(a.isRead) - Number(b.isRead));
  renderNotifications(dropdown, sorted);
  updateBadge(badge, notifications);

  bell.addEventListener("click", async () => {
    const list = await fetchNotifications();
    const sortedList = list.sort((a, b) => Number(a.isRead) - Number(b.isRead));
    renderNotifications(dropdown, sortedList);
    updateBadge(badge, list);
    dropdown.hidden = !dropdown.hidden;
  });

  dropdown.addEventListener("click", async (event) => {
    const button = event.target.closest(".notification-item");
    if (!button) return;
    const id = button.dataset.id;
    await markRead(id);
    button.classList.add("read");
    const list = await fetchNotifications();
    updateBadge(badge, list);
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target) && !bell.contains(event.target)) {
      dropdown.hidden = true;
    }
  });
});
