const express = require("express");
const router = express.Router();

const authRoles = require("../middleware/authRoles");
const Notification = require("../models/Notification");

router.get("/", authRoles(["admin", "staff", "student"]), async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
      role: req.user.role
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.patch("/:id/read", authRoles(["admin", "staff", "student"]), async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, role: req.user.role },
      { isRead: true },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification" });
  }
});

module.exports = router;
