const express = require("express");
const router = express.Router();

const authAdmin = require("../middleware/authAdmin");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Staff = require("../models/Staff");
const Student = require("../models/Student");
const StudentFlag = require("../models/StudentFlag");
const ChangeRequest = require("../models/ChangeRequest");
const Complaint = require("../models/Complaint");
const ExamAttempt = require("../models/ExamAttempt");
const StudyCenter = require("../models/StudyCenter");
const AdminSettings = require("../models/AdminSettings");
const MaterialUsage = require("../models/MaterialUsage");

/* =========================
   STATS
========================= */
router.get("/stats", authAdmin, async (req, res) => {
  try {
    const [students, staff, mocks] = await Promise.all([
      Student.countDocuments({}),
      Staff.countDocuments({}),
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
    const users = await User.find({ role: "student" })
      .select("_id fullName email status")
      .lean();

    if (!users.length) {
      return res.json([]);
    }

    const userIds = users.map((u) => u._id);
    const profiles = await Student.find({ user_id: { $in: userIds } })
      .select("user_id phone studyCenter study_center faculty facultyName program programName lastLogin loginCount")
      .lean();
    const profileByUserId = new Map(profiles.map((p) => [String(p.user_id), p]));

    const rawCenterValues = profiles
      .map((p) => p.studyCenter || p.study_center)
      .filter(Boolean)
      .map((value) => String(value).trim());
    const uniqueCenterIds = Array.from(
      new Set(rawCenterValues.filter((value) => /^[0-9a-fA-F]{24}$/.test(value)))
    );

    const centerById = new Map();
    if (uniqueCenterIds.length) {
      const centers = await StudyCenter.find({ _id: { $in: uniqueCenterIds } })
        .select("_id name")
        .lean();
      centers.forEach((center) => {
        centerById.set(String(center._id), String(center.name || "").trim());
      });
    }

    const students = users.map((user) => {
      const profile = profileByUserId.get(String(user._id)) || {};
      const rawCenter = String(profile.studyCenter || profile.study_center || "").trim();
      const resolvedCenter =
        (rawCenter && centerById.get(rawCenter)) || rawCenter;
      return {
        _id: String(user._id),
        fullName: user.fullName || "",
        email: user.email || "",
        status: user.status || "active",
        phone: profile.phone || "",
        studyCenter: resolvedCenter,
        faculty: profile.facultyName || profile.faculty || "",
        program: profile.programName || profile.program || "",
        lastLogin: profile.lastLogin || null,
        loginCount: Number(profile.loginCount || 0)
      };
    });

    return res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

router.get("/students/:id", authAdmin, async (req, res) => {
  try {
    const studentUserId = String(req.params.id || "").trim();
    if (!studentUserId) {
      return res.status(400).json({ message: "Student id is required" });
    }

    const user = await User.findOne({ _id: studentUserId, role: "student" })
      .select("fullName email status phoneNumber createdAt")
      .lean();
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentProfile = await Student.findOne({ user_id: user._id })
      .select("phone matricNo level semester facultyName programName referralCode createdAt studyCenter study_center lastLogin loginCount")
      .lean();

    const rawCenter = String(studentProfile?.studyCenter || studentProfile?.study_center || "").trim();
    let resolvedStudyCenter = rawCenter;
    if (rawCenter && /^[0-9a-fA-F]{24}$/.test(rawCenter)) {
      const center = await StudyCenter.findById(rawCenter).select("name").lean();
      if (center?.name) {
        resolvedStudyCenter = String(center.name).trim();
      }
    }

    const referralCount = await Student.countDocuments({ referredBy: studentProfile?._id });

    const topByType = async (type) =>
      MaterialUsage.aggregate([
        { $match: { student: studentProfile?._id, type } },
        {
          $group: {
            _id: "$materialTitle",
            count: { $sum: 1 },
            lastUsedAt: { $max: "$createdAt" }
          }
        },
        { $sort: { count: -1, lastUsedAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            materialTitle: "$_id",
            count: 1
          }
        }
      ]);

    const [pastQuestions, rawMaterials, mocks] = studentProfile?._id
      ? await Promise.all([
          topByType("past-question"),
          topByType("raw-material"),
          topByType("mock")
        ])
      : [[], [], []];

    return res.json({
      student: {
        id: String(user._id),
        fullName: user.fullName || "",
        email: user.email || "",
        status: user.status || "active",
        phone: studentProfile?.phone || user.phoneNumber || "",
        matricNo: studentProfile?.matricNo || "",
        level: studentProfile?.level || "",
        semester: studentProfile?.semester || "",
        facultyName: studentProfile?.facultyName || "",
        programName: studentProfile?.programName || "",
        studyCenter: resolvedStudyCenter,
        referralCode: studentProfile?.referralCode || "",
        lastLogin: studentProfile?.lastLogin || null,
        loginCount: Number(studentProfile?.loginCount || 0),
        createdAt: studentProfile?.createdAt || user.createdAt || null
      },
      referralCount,
      topUsedMaterials: {
        pastQuestions,
        rawMaterials,
        mocks
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load student details" });
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
    const staff = await Staff.find()
      .select("email permissions createdAt createdBy")
      .sort({ createdAt: -1 })
      .lean();

    if (!staff.length) {
      return res.json([]);
    }

    const creatorIds = Array.from(
      new Set(
        staff
          .map((item) => String(item.createdBy || "").trim())
          .filter((value) => /^[0-9a-fA-F]{24}$/.test(value))
      )
    );

    const [admins, users, creatorsAsStaff] = await Promise.all([
      creatorIds.length
        ? Admin.find({ _id: { $in: creatorIds } }).select("_id email").lean()
        : [],
      creatorIds.length
        ? User.find({ _id: { $in: creatorIds } }).select("_id fullName email").lean()
        : [],
      creatorIds.length
        ? Staff.find({ _id: { $in: creatorIds } }).select("_id fullName email").lean()
        : []
    ]);

    const adminById = new Map(admins.map((item) => [String(item._id), item]));
    const userById = new Map(users.map((item) => [String(item._id), item]));
    const staffById = new Map(creatorsAsStaff.map((item) => [String(item._id), item]));

    const payload = staff.map((item) => {
      const createdById = String(item.createdBy || "").trim();
      const admin = adminById.get(createdById);
      const user = userById.get(createdById);
      const staffCreator = staffById.get(createdById);
      const createdByLabel =
        admin?.email ||
        user?.fullName ||
        user?.email ||
        staffCreator?.fullName ||
        staffCreator?.email ||
        "Admin";

      return {
        ...item,
        createdBy: createdByLabel
      };
    });

    res.json(payload);
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

/* =========================
   MATERIAL USAGE SUMMARY
========================= */
router.get("/usage-summary", authAdmin, async (req, res) => {
  try {
    const summarizeByType = async (type) => {
      return MaterialUsage.aggregate([
        { $match: { type } },
        {
          $group: {
            _id: "$materialTitle",
            count: { $sum: 1 },
            lastUsedAt: { $max: "$createdAt" }
          }
        },
        { $sort: { count: -1, lastUsedAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            materialTitle: "$_id",
            count: 1,
            lastUsedAt: 1
          }
        }
      ]);
    };

    const [pastQuestions, rawMaterials, mocks] = await Promise.all([
      summarizeByType("past-question"),
      summarizeByType("raw-material"),
      summarizeByType("mock")
    ]);

    res.json({
      pastQuestions,
      rawMaterials,
      mocks
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load usage summary" });
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
