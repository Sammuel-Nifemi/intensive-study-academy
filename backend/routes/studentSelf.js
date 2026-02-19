const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const Student = require("../models/Student");
const User = require("../models/User");
const Program = require("../models/Program");
const Faculty = require("../models/Faculty");
const StudyCenter = require("../models/StudyCenter");
const CourseMaterial = require("../models/CourseMaterial");
const MockExam = require("../models/MockExam");
const requirePayPerUse = require("../middleware/requirePayPerUse");
const { getMyFees } = require("../controllers/fees.controller");
const { submitStudentReview } = require("../controllers/reviewController");
const { logStudentActivity } = require("../controllers/activityLog.controller");

// GET /api/student/me
router.get("/me", authStudent, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const user = await User.findById(req.user.id).select(
      "fullName email phoneNumber dobDay dobMonth"
    );

    const profileCompleted =
      Boolean(student.profileCompleted) ||
      Boolean(student.profileComplete) ||
      Boolean(student.profile_complete);

    let programName = student.programName || null;
    let facultyName = student.facultyName || null;
    let studyCenterName = null;

    if (student.programId) {
      const program = await Program.findById(student.programId).select("name facultyId");
      if (program?.name) programName = program.name;
      if (!student.facultyId && program?.facultyId) {
        student.facultyId = program.facultyId;
      }
    }

    if (student.facultyId) {
      const faculty = await Faculty.findById(student.facultyId).select("name");
      if (faculty?.name) facultyName = faculty.name;
    }

    if (student.study_center) {
      const center = await StudyCenter.findById(student.study_center).select("name");
      if (center?.name) studyCenterName = center.name;
    }

    res.json({
      _id: student._id,
      isaStudentId: student.isaStudentId || null,
      studentAlias: student.studentAlias || null,
      name: user?.fullName || null,
      fullName: user?.fullName || null,
      email: user?.email || student.email || null,
      phone: student.phone || user?.phoneNumber || null,
      title: student.title || null,
      gender: student.gender || null,
      dobDay: user?.dobDay ?? student?.birthday?.day ?? null,
      dobMonth: user?.dobMonth ?? student?.birthday?.month ?? null,
      studyCenterId: student.study_center || null,
      studyCenter: studyCenterName || null,
      studyCenterName: studyCenterName || null,
      center: studyCenterName || student.study_center || null,
      facultyId: student.facultyId || null,
      faculty: facultyName || null,
      facultyName: facultyName || null,
      programId: student.programId || null,
      program: programName || null,
      programName: programName || null,
      level: student.level || null,
      semester: student.semester || null,
      profileCompleted,
      registeredCourses: student.registeredCourses || []
    });
  } catch (err) {
    console.error("Student me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/student/complete-profile
router.post("/complete-profile", authStudent, async (req, res) => {
  try {
    const {
      fullName,
      title,
      gender,
      phone,
      dobDay,
      dobMonth,
      studyCenterId,
      facultyId,
      programId,
      level,
      semester
    } = req.body;

    if (
      !fullName ||
      !title ||
      !gender ||
      !dobDay ||
      !dobMonth ||
      !studyCenterId ||
      !facultyId ||
      !programId ||
      !level ||
      !semester
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedDay = Number(dobDay);
    const parsedMonth = Number(dobMonth);
    if (parsedDay < 1 || parsedDay > 31 || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ message: "Invalid birthday" });
    }

    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const program = await Program.findById(programId).select("name facultyId");
    const faculty = await Faculty.findById(facultyId).select("name");
    if (!program) {
      return res.status(400).json({ message: "Invalid program" });
    }
    if (!faculty) {
      return res.status(400).json({ message: "Invalid faculty" });
    }

    const user = await User.findById(req.user.id);
    if (user) {
      user.fullName = String(fullName).trim();
      if (phone) user.phoneNumber = String(phone).trim();
      user.dobDay = parsedDay;
      user.dobMonth = parsedMonth;
      await user.save();
    }

    student.study_center = studyCenterId;
    student.facultyId = facultyId;
    student.programId = programId;
    student.level = String(level).trim();
    student.semester = String(semester).trim();
    student.program = program.name;
    student.programName = program.name;
    student.faculty = faculty.name;
    student.facultyName = faculty.name;
    student.title = String(title).trim();
    student.gender = String(gender).trim();
    if (phone) student.phone = String(phone).trim();
    student.birthday = { day: parsedDay, month: parsedMonth };

    student.profileCompleted = true;
    student.profileComplete = true;
    student.profile_complete = true;

    await student.save();

    res.json({
      fullName: user?.fullName || student.fullName || null,
      title: student.title,
      gender: student.gender,
      phone: student.phone || user?.phoneNumber || null,
      dobDay: parsedDay,
      dobMonth: parsedMonth,
      studyCenterId: student.study_center,
      facultyId: student.facultyId,
      programId: student.programId,
      level: student.level,
      semester: student.semester,
      profileCompleted: true
    });
  } catch (err) {
    console.error("Complete profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/student/materials
router.get("/materials", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const items = await CourseMaterial.find({
      program: student.programId,
      level: student.level,
      semester: student.semester
    })
      .select("title courseCode fileUrl materialType")
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) {
    console.error("Student materials error:", err);
    res.status(500).json({ message: "Failed to load materials" });
  }
});

// GET /api/student/materials/download?course=CODE
router.get(
  "/materials/download",
  authStudent,
  checkStudentProfileComplete,
  requirePayPerUse("materials"),
  async (req, res) => {
    try {
      const course = String(req.query.course || "").toUpperCase().trim();
      if (!course) return res.status(400).json({ message: "Course is required" });

      const item = await CourseMaterial.findOne({ courseCode: course })
        .sort({ createdAt: -1 })
        .lean();

      if (!item || !item.fileUrl) {
        return res.status(404).json({ message: "Material not found" });
      }

      const fileUrl = String(item.fileUrl);
      if (/^https?:\/\//i.test(fileUrl)) {
        return res.redirect(fileUrl);
      }

      const normalized = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
      return res.redirect(normalized);
    } catch (err) {
      console.error("Material download error:", err);
      res.status(500).json({ message: "Failed to download material" });
    }
  }
);

// GET /api/student/mocks
router.get("/mocks", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const items = await MockExam.find({
      program: student.programId,
      level: student.level,
      semester: student.semester
    })
      .select("title fileUrl")
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) {
    console.error("Student mocks error:", err);
    res.status(500).json({ message: "Failed to load mocks" });
  }
});

// GET /api/student/fees
router.get("/fees", authStudent, checkStudentProfileComplete, getMyFees);

// POST /api/student/review
router.post("/review", authStudent, submitStudentReview);

// POST /api/student/activity
router.post("/activity", authStudent, logStudentActivity);

module.exports = router;
