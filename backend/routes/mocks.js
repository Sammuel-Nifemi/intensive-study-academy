const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const authRoles = require("../middleware/authRoles");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const { submitMockAttempt } = require("../controllers/mockSubmission.controller");

const MockExam = require("../models/MockExam");
const CBTExam = require("../models/CBTExam");
const Staff = require("../models/Staff");
const Student = require("../models/Student");
const Program = require("../models/Program");
const CBTAttempt = require("../models/CBTAttempt");

async function resolveProgramId(programValue) {
  if (!programValue) return null;
  if (programValue && programValue.match(/^[0-9a-fA-F]{24}$/)) {
    return programValue;
  }
  const program = await Program.findOne({ name: programValue }).select("_id");
  return program?._id || null;
}

async function getStudentProfile(req, res) {
  const student = await Student.findOne({ user_id: req.user.id });
  if (!student) {
    res.status(404).json({ message: "Student not found" });
    return null;
  }

  const profileCompleted = Boolean(
    student.profileCompleted || student.profileComplete || student.profile_complete
  );
  if (!profileCompleted) {
    res.status(400).json({
      message: "Student profile is missing faculty, program, level, or semester."
    });
    return null;
  }

  const programId = await resolveProgramId(student.program);
  if (!programId) {
    res.status(400).json({ message: "Student program is invalid." });
    return null;
  }

  return {
    student,
    programId,
    faculty: student.faculty,
    level: student.level,
    semester: student.semester
  };
}

router.get("/", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const profile = await getStudentProfile(req, res);
    if (!profile) return;

    const mocks = await MockExam.find({
      faculty: profile.faculty,
      program: profile.programId,
      level: profile.level,
      semester: profile.semester
    })
      .select("title courseCode staffId createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (!mocks.length) {
      return res.json([]);
    }

    const courseCodes = mocks.map((m) => m.courseCode).filter(Boolean);
    const exams = await CBTExam.find({ courseCode: { $in: courseCodes } })
      .select("courseCode durationMinutes totalQuestions")
      .lean();
    const examMap = new Map(exams.map((e) => [String(e.courseCode), e]));

    const staffIds = mocks.map((m) => m.staffId).filter(Boolean);
    const staffs = await Staff.find({ _id: { $in: staffIds } })
      .select("fullName email")
      .lean();
    const staffMap = new Map(staffs.map((s) => [String(s._id), s]));

    const payload = mocks.map((m) => {
      const exam = examMap.get(String(m.courseCode));
      const staff = staffMap.get(String(m.staffId));
      return {
        id: m._id,
        title: m.title || m.courseCode || "Mock Exam",
        courseCode: m.courseCode,
        durationMinutes: exam?.durationMinutes || 0,
        staffName: staff?.fullName || staff?.email || "Staff"
      };
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to load mocks" });
  }
});

// POST /api/mocks/submit
router.post("/submit", authStudent, checkStudentProfileComplete, submitMockAttempt);

router.get("/summary", authRoles(["staff", "admin"]), async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== "staff" && role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    let filter = {};

    if (role === "staff") {
      filter = { staffId: req.user.id };
    }

    const mocks = await MockExam.find(filter)
      .select("_id title courseCode staffId createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (!mocks.length) {
      return res.json({ success: true, data: [] });
    }

    const mockIds = mocks.map((m) => m._id);
    const attempts = await CBTAttempt.find({ mockId: { $in: mockIds } })
      .select("mockId score totalQuestions")
      .lean();

    const attemptMap = new Map();
    attempts.forEach((a) => {
      const key = String(a.mockId);
      if (!attemptMap.has(key)) {
        attemptMap.set(key, { count: 0, sum: 0 });
      }
      const entry = attemptMap.get(key);
      const pct = a.totalQuestions ? (a.score / a.totalQuestions) * 100 : 0;
      entry.count += 1;
      entry.sum += pct;
    });

    const data = mocks.map((m) => {
      const stats = attemptMap.get(String(m._id)) || { count: 0, sum: 0 };
      const avg = stats.count ? Math.round(stats.sum / stats.count) : 0;
      return {
        id: m._id,
        title: m.title || m.courseCode || "Mock Exam",
        courseCode: m.courseCode,
        attempts: stats.count,
        averageScore: avg
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: "Failed to load mock summary" });
  }
});

module.exports = router;
