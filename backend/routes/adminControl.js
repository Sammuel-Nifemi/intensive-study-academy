const express = require("express");
const router = express.Router();

const authAdmin = require("../middleware/authAdmin");

const User = require("../models/User");
const Student = require("../models/Student");
const StudentFlag = require("../models/StudentFlag");
const ChangeRequest = require("../models/ChangeRequest");
const Complaint = require("../models/Complaint");
const ExamAttempt = require("../models/ExamAttempt");
const StudyCenter = require("../models/StudyCenter");
const AdminSettings = require("../models/AdminSettings");

/* =========================
   STATS
========================= */
router.get("/stats", authAdmin, async (req, res) => {
  try {
    const [students, staff, mocks] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "staff" }),
      ExamAttempt.countDocuments({})
    ]);

    res.json({ students, staff, mocks });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

/* =========================
   STUDENTS
========================= */
router.get("/students", authAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("fullName email status student");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

router.post("/students/flag", authAdmin, async (req, res) => {
  try {
    const { studentId, reason } = req.body;
    if (!studentId || !reason) {
      return res.status(400).json({ message: "studentId and reason required" });
    }

    let student = await Student.findOne({ user_id: studentId });
    if (!student) {
      student = await Student.findById(studentId);
    }
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const flag = await StudentFlag.create({ studentId: student._id, reason });
    res.status(201).json({ message: "Student flagged", flag });
  } catch (err) {
    res.status(500).json({ message: "Failed to flag student" });
  }
});

router.post("/students/suspend", authAdmin, async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: "studentId required" });

    const user = await User.findByIdAndUpdate(
      studentId,
      { status: "suspended" },
      { new: true }
    );

    res.json({ message: "Student suspended", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to suspend student" });
  }
});

/* =========================
   STAFF
========================= */
router.get("/staff", authAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" })
      .select("fullName email status");
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});

router.post("/staff/create", authAdmin, async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email, password required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash(password, 10);

    const staff = await User.create({
      fullName,
      email,
      password: hashed,
      role: "staff",
      status: "active"
    });

    res.status(201).json({ message: "Staff created", staff });
  } catch (err) {
    res.status(500).json({ message: "Failed to create staff" });
  }
});

router.post("/staff/disable", authAdmin, async (req, res) => {
  try {
    const { staffId } = req.body;
    if (!staffId) return res.status(400).json({ message: "staffId required" });

    const staff = await User.findByIdAndUpdate(
      staffId,
      { status: "disabled" },
      { new: true }
    );

    res.json({ message: "Staff disabled", staff });
  } catch (err) {
    res.status(500).json({ message: "Failed to disable staff" });
  }
});

/* =========================
   CHANGE REQUESTS
========================= */
router.get("/requests", authAdmin, async (req, res) => {
  try {
    const requests = await ChangeRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

router.post("/requests/approve", authAdmin, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ message: "requestId required" });

    const request = await ChangeRequest.findByIdAndUpdate(
      requestId,
      { status: "approved" },
      { new: true }
    );
    res.json({ message: "Request approved", request });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve request" });
  }
});

router.post("/requests/reject", authAdmin, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ message: "requestId required" });

    const request = await ChangeRequest.findByIdAndUpdate(
      requestId,
      { status: "rejected" },
      { new: true }
    );
    res.json({ message: "Request rejected", request });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject request" });
  }
});

/* =========================
   COMPLAINTS
========================= */
router.get("/complaints", authAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

/* =========================
   STUDY CENTER ANALYTICS
========================= */
router.get("/study-centers/analytics", authAdmin, async (req, res) => {
  try {
    const centers = await StudyCenter.find();
    const students = await Student.find().select("study_center");

    const counts = {};
    students.forEach(s => {
      const id = s.study_center ? String(s.study_center) : "unknown";
      counts[id] = (counts[id] || 0) + 1;
    });

    const result = centers.map(c => ({
      id: c._id,
      name: c.name,
      count: counts[String(c._id)] || 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

/* =========================
   SETTINGS
========================= */
router.get("/settings", authAdmin, async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({ theme: "light" });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

router.put("/settings", authAdmin, async (req, res) => {
  try {
    const { theme } = req.body;
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({ theme: theme || "light" });
    } else {
      settings.theme = theme || settings.theme;
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings" });
  }
});

module.exports = router;
