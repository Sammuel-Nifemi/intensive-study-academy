const Announcement = require("../models/Announcement");

/* =========================
   STUDENT: READ ANNOUNCEMENTS
========================= */
exports.getStudentAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
};
