const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const Program = require("../models/Program");
const StudyCenter = require("../models/StudyCenter");
const StudentCourse = require("../models/StudentCourse");

/* =========================
   STUDENT DASHBOARD
========================= */
exports.getStudentDashboard = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
  return res.status(401).json({ message: "Unauthorized: no user data" });
}

    const user = await User.findById(req.user.id);

    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const courseLinks = await StudentCourse.find({ student_id: student._id })
      .select("course_id");
    const registeredCourses = courseLinks.map(link => link.course_id);

    const profileCompleted = Boolean(
      student?.profileCompleted || student?.profileComplete || student?.profile_complete
    );
    const hasCourses = registeredCourses.length > 0;

    const canTakeExams = profileCompleted && hasCourses;
    const canRegisterCourses = !hasCourses;

    let studyCenterName = null;
    if (student?.study_center && mongoose.isValidObjectId(student.study_center)) {
      try {
        const center = await StudyCenter.findById(student.study_center).select("name");
        studyCenterName = center?.name || null;
      } catch {
        studyCenterName = null;
      }
    }

    let programName = student.program || null;
    if (student?.program && mongoose.isValidObjectId(student.program)) {
      try {
        const program = await Program.findById(student.program).select("name");
        programName = program?.name || programName;
      } catch {
        programName = student.program;
      }
    }

    res.json({
      student: {
        name: user.fullName || "",
        fullName: user.fullName || "",
        email: user.email,
        gender: student.gender || null,
        phone: student.phone || null,
        program: programName,
        faculty: student.faculty || null,
        level: student.level || null,
        semester: student.semester || null,
        studyCenter: studyCenterName || student.study_center || null,
        registeredCourses,
        profile_complete: student.profile_complete ?? false,
        profileComplete: student.profileComplete ?? false,
        profileCompleted
      },
      canTakeExams,
      canRegisterCourses
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
