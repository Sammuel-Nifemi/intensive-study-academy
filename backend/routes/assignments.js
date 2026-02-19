const express = require("express");
const router = express.Router();

const authAdmin = require("../middleware/authAdmin");
const authStudent = require("../middleware/authStudent");
const AssignmentRequest = require("../models/AssignmentRequest");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const { notifyUsers } = require("../utils/notifyUsers");

router.get("/", authAdmin, async (req, res) => {
  try {
    const requests = await AssignmentRequest.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json(requests);
  } catch (err) {
    console.error("Failed to load assignment requests", err);
    res.status(500).json({ message: "Failed to load assignment requests" });
  }
});

router.patch("/:id", authAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = new Set(["pending", "contacted", "closed"]);
    if (!allowed.has(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await AssignmentRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Assignment request not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Failed to update assignment request", err);
    res.status(500).json({ message: "Failed to update assignment request" });
  }
});

router.post("/respond", authStudent, async (req, res) => {
  try {
    const { assignmentId, response } = req.body || {};
    if (!assignmentId || !response) {
      return res.status(400).json({ message: "assignmentId and response are required" });
    }

    const normalized = String(response).toLowerCase();
    if (!["accepted", "declined"].includes(normalized)) {
      return res.status(400).json({ message: "Invalid response" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (String(assignment.studentId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    assignment.status = normalized;
    assignment.respondedAt = new Date();
    await assignment.save();

    const admins = await User.find({ role: "admin" }).select("_id role").lean();
    await notifyUsers(
      admins,
      "assignment-response",
      "Assignment Response",
      `Student ${normalized} the assignment`,
      { assignmentId: assignment._id, response: normalized }
    );

    res.json({ success: true, status: assignment.status });
  } catch (err) {
    console.error("Assignment respond error", err);
    res.status(500).json({ message: "Failed to update assignment" });
  }
});

router.get("/responses", authAdmin, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate({ path: "studentId", select: "fullName email phoneNumber" })
      .populate({ path: "courseId", select: "code course_code title name" })
      .sort({ createdAt: -1 })
      .lean();

    res.json(assignments);
  } catch (err) {
    console.error("Failed to load assignment responses", err);
    res.status(500).json({ message: "Failed to load assignment responses" });
  }
});

module.exports = router;
