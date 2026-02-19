const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");
const { loginStudent, registerStudent } = require("../controllers/studentAuth.controller");
const {
  getMyProfile,
  updatePersonalProfile,
  getMyCourses,
  updateMyProfile,
  submitAcademicChangeRequest,
  submitComplaint,
  deleteMyAccount,
  completeStudentSetup
} = require("../controllers/studentController");
const {
  getStudentDashboard
} = require("../controllers/studentDashboard.controller");
const {
  getStudentFees
} = require("../controllers/studentFees.controller");

// Get logged-in student profile
router.get("/me", authStudent, getMyProfile);

// Update personal profile (read-only after completion)
router.post("/me/profile", authStudent, updatePersonalProfile);

// Get logged-in student courses (master list)
router.get("/me/courses", authStudent, getMyCourses);

// Update logged-in student profile
router.put("/me", authStudent, updateMyProfile);

// Academic change request
router.post("/me/academic-change-request", authStudent, submitAcademicChangeRequest);

// Complaint
router.post("/me/complaints", authStudent, submitComplaint);

// Delete account
router.delete("/me", authStudent, deleteMyAccount);

// Student register
router.post("/register", registerStudent);

// Student login
router.post("/login", loginStudent);

// Student dashboard (protected)
router.get("/dashboard", authStudent, checkStudentProfileComplete, getStudentDashboard);
router.get("/fees", authStudent, checkStudentProfileComplete, getStudentFees);

// Complete student setup (onboarding)
router.post("/setup", authStudent, completeStudentSetup);

// Update academic profile
router.post("/profile", authStudent, async (req, res) => {
  try {
    const { faculty, program, level, semester, studyCenter } = req.body;

    const Student = require("../models/Student");
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!faculty || !program || !level || !semester) {
      return res.status(400).json({ message: "All profile fields are required." });
    }

    student.faculty = String(faculty).trim();
    student.program = String(program).trim();
    student.level = String(level).trim();
    student.semester = String(semester).trim();
    if (studyCenter !== undefined) {
      student.study_center = String(studyCenter).trim();
    }

    student.profileCompleted = true;
    student.profileComplete = true;
    student.profile_complete = true;

    await student.save();

    res.json({ success: true, student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});



module.exports = router;
