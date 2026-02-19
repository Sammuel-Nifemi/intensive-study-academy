const cron = require("node-cron");
const User = require("../models/User");
const { notifyUsers } = require("./notifyUsers");

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function getNextBirthday(dobDay, dobMonth, today) {
  const next = new Date(today.getFullYear(), dobMonth - 1, dobDay);
  if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    next.setFullYear(today.getFullYear() + 1);
  }
  return next;
}

async function runBirthdayNotifications() {
  const today = new Date();
  const users = await User.find({ dobDay: { $exists: true }, dobMonth: { $exists: true } }).lean();
  if (!users.length) return;

  const admins = await User.find({ role: "admin" }).select("_id role").lean();

  for (const user of users) {
    const day = Number(user.dobDay);
    const month = Number(user.dobMonth);
    if (!Number.isInteger(day) || day < 1 || day > 31) continue;
    if (!Number.isInteger(month) || month < 1 || month > 12) continue;

    const nextBirthday = getNextBirthday(day, month, today);
    const daysUntil = Math.round(
      (nextBirthday.setHours(0, 0, 0, 0) - new Date(today.setHours(0, 0, 0, 0))) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntil === 7) {
      const message = `${user.fullName}'s birthday is in 7 days (${formatDate(nextBirthday)}). Phone: ${user.phoneNumber || "N/A"}`;
      await notifyUsers(
        admins.map((a) => ({ id: a._id, role: "admin" })),
        "birthday-reminder",
        "Upcoming Birthday",
        message,
        { userId: user._id }
      );
    }

    if (daysUntil === 0) {
      const adminMessage = `It's ${user.fullName}'s birthday today! Phone: ${user.phoneNumber || "N/A"}`;
      await notifyUsers(
        admins.map((a) => ({ id: a._id, role: "admin" })),
        "birthday-today",
        "Happy Birthday!",
        adminMessage,
        { userId: user._id }
      );

      const userMessage = `It's ${user.fullName}'s birthday today!`;
      if (user.role === "admin") {
        await notifyUsers(
          [{ id: user._id, role: "admin" }],
          "birthday-today",
          "Happy Birthday!",
          adminMessage,
          { userId: user._id }
        );
      } else {
        await notifyUsers(
          [{ id: user._id, role: user.role }],
          "birthday-today",
          "Happy Birthday!",
          userMessage,
          { userId: user._id }
        );
      }
    }
  }
}

function startBirthdayCron() {
  cron.schedule("0 9 * * *", () => {
    runBirthdayNotifications().catch((err) => {
      console.error("Birthday cron error:", err);
    });
  });
}

module.exports = { startBirthdayCron, runBirthdayNotifications };
