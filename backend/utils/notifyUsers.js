const Notification = require("../models/Notification");

function normalizeUsers(users) {
  return (users || [])
    .map((user) => {
      if (!user) return null;
      if (user.id && user.role) return { id: user.id, role: user.role };
      if (user._id && user.role) return { id: user._id, role: user.role };
      return null;
    })
    .filter(Boolean);
}

async function notifyUsers(users, type, title, message, data) {
  const targets = normalizeUsers(users);
  if (!targets.length) return [];

  const docs = targets.map((target) => ({
    userId: target.id,
    role: target.role,
    type,
    title,
    message,
    data
  }));

  return Notification.insertMany(docs);
}

module.exports = { notifyUsers };
