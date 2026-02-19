const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const Program = require("../models/Program");
const StudyCenter = require("../models/StudyCenter");
const AcademicChangeRequest = require("../models/AcademicChangeRequest");
const Complaint = require("../models/Complaint");
const AdminCourse = require("../models/AdminCourse");
const ProgramCourse = require("../models/ProgramCourse");
const Staff = require("../models/Staff");
const { notifyUsers } = require("../utils/notifyUsers");

/* =========================
   GET LOGGED-IN STUDENT PROFILE
========================= */
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let programName = student.programName || student.program || null;
    let programId = student.programId || null;
    let facultyName = student.facultyName || student.faculty || null;
    let facultyId = student.facultyId || null;
    let studyCenterName = student.study_center || null;

    if (programId && mongoose.isValidObjectId(programId)) {
      const program = await Program.findById(programId).select(
        "name facultyId facultyName"
      );
      if (program?.name) programName = program.name;
      if (!facultyName && program?.facultyName) {
        facultyName = program.facultyName;
      }
      if (!facultyId && program?.facultyId) {
        facultyId = program.facultyId;
      }
    } else if (student.program && !facultyName) {
      const program = await Program.findOne({ name: student.program }).select(
        "name facultyId facultyName"
      );
      if (program?.name) programName = program.name;
      if (program?.facultyName) {
        facultyName = program.facultyName;
      }
      if (!facultyId && program?.facultyId) {
        facultyId = program.facultyId;
      }
      if (!programId && program?._id) {
        programId = program._id;
      }
    }

    if (student.study_center && mongoose.isValidObjectId(student.study_center)) {
      const center = await StudyCenter.findById(student.study_center).select("name");
      if (center?.name) studyCenterName = center.name;
    }

    const birthday = student.birthday || {};
    res.json({
      fullName: user.fullName,
      email: user.email,
      title: student.title || null,
      gender: student.gender || null,
      phone: student.phone || null,
      birthday: {
        day: birthday.day ?? null,
        month: birthday.month ?? null
      },
      faculty: facultyName || null,
      facultyId: facultyId || null,
      facultyName: facultyName || null,
      program: programName,
      programId: programId || null,
      programName: programName || null,
      level: student.level || null,
      semester: student.semester || null,
      studyCenter: studyCenterName,
      study_center: student.study_center || null,
      dobDay: birthday.day ?? null,
      dobMonth: birthday.month ?? null,
      avatarUrl: student.avatarUrl || null,
      profile_complete: student.profile_complete ?? false,
      profileComplete: student.profileComplete ?? false,
      profileCompleted: student.profileCompleted ?? false
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE PERSONAL PROFILE (READ-ONLY AFTER COMPLETE)
========================= */
exports.updatePersonalProfile = async (req, res) => {
  try {
    const { title, gender, phone, birthday } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.profileCompleted) {
      return res.status(403).json({ message: "Profile is read-only" });
    }

    student.title = title ?? student.title ?? null;
    student.gender = gender ?? student.gender ?? null;
    student.phone = phone ?? student.phone ?? null;

    const currentBirthday = student.birthday || {};
    const incomingDay = birthday?.day;
    const incomingMonth = birthday?.month;
    const dayValue =
      incomingDay !== undefined && incomingDay !== null
        ? Number(incomingDay)
        : currentBirthday.day ?? null;
    const monthValue =
      incomingMonth !== undefined && incomingMonth !== null
        ? Number(incomingMonth)
        : currentBirthday.month ?? null;
    student.birthday = {
      day: Number.isNaN(dayValue) ? null : dayValue,
      month: Number.isNaN(monthValue) ? null : monthValue
    };

    const isComplete =
      student.title &&
      student.gender &&
      student.phone &&
      Number.isInteger(student.birthday?.day) &&
      Number.isInteger(student.birthday?.month);

    if (isComplete) {
      student.profileCompleted = true;
    }

    await student.save();

    res.json({
      message: "Profile saved",
      profileCompleted: student.profileCompleted,
      student: {
        title: student.title || null,
        gender: student.gender || null,
        phone: student.phone || null,
        birthday: {
          day: student.birthday?.day ?? null,
          month: student.birthday?.month ?? null
        }
      }
    });
  } catch (err) {
    console.error("Update personal profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/* =========================
   GET LOGGED-IN STUDENT COURSES (MASTER LIST)
========================= */
exports.getMyCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let programId = student.programId || null;
    if (!programId && student.program) {
      const program = await Program.findOne({ name: student.program }).select("_id");
      if (program?._id) programId = program._id;
    }

    if (!programId || !student.level || !student.semester) {
      return res.status(400).json({
        message: "Student profile is missing program, level, or semester."
      });
    }

    const mappings = await ProgramCourse.find({
      program: programId,
      level: String(student.level).trim(),
      semester: String(student.semester).trim()
    }).lean();

    const codes = mappings.map((m) => m.courseCode).filter(Boolean);
    const courses = await AdminCourse.find({
      courseCode: { $in: codes }
    }).select("courseCode title").lean();
    const courseMap = new Map(courses.map((c) => [String(c.courseCode), c]));

    const toSummary = (mapping) => {
      const course = courseMap.get(String(mapping.courseCode));
      return {
        courseCode: mapping.courseCode,
        title: course?.title || mapping.courseCode
      };
    };

    const compulsoryCourses = mappings
      .filter((m) => m.category === "compulsory")
      .map(toSummary);
    const electiveCourses = mappings
      .filter((m) => m.category === "elective")
      .map(toSummary);

    res.json({
      faculty: student.faculty || null,
      program: student.program || null,
      level: student.level || null,
      semester: student.semester || null,
      compulsoryCourses,
      electiveCourses
    });
  } catch (err) {
    console.error("Student courses error:", err);
    res.status(500).json({ message: "Failed to load courses" });
  }
};

/* =========================
   UPDATE LOGGED-IN STUDENT PROFILE (USER MODEL)
========================= */
exports.updateMyProfile = async (req, res) => {
  try {
    const { gender, phone, programId, level, semester, studyCenter } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (gender !== undefined) {
      student.gender = gender ?? null;
    }
    if (phone !== undefined) {
      student.phone = phone ?? null;
    }

    if (programId) {
      const program = await Program.findById(programId).select(
        "name facultyId facultyName"
      );
      if (!program) {
        return res.status(400).json({ message: "Invalid program" });
      }
      student.programId = program._id;
      student.programName = program.name;
      student.facultyId = program.facultyId;
      student.facultyName = program.facultyName;
      student.program = program.name;
      student.faculty = program.facultyName;
    }

    if (level !== undefined) {
      student.level = level ?? null;
    }
    if (semester !== undefined) {
      student.semester = semester ?? null;
    }
    if (studyCenter !== undefined) {
      student.study_center = studyCenter ?? null;
    }
    await student.save();

    res.json({
      message: "Profile updated",
      student: {
        fullName: user.fullName,
        email: user.email,
        gender: student.gender || null,
        phone: student.phone || null,
        faculty: student.facultyName || student.faculty || null,
        facultyId: student.facultyId || null,
        programId: student.programId || null,
        programName: student.programName || student.program || null,
        level: student.level || null,
        semester: student.semester || null,
        studyCenter: student.study_center || null
      }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/* =========================
   SUBMIT ACADEMIC CHANGE REQUEST
========================= */
exports.submitAcademicChangeRequest = async (req, res) => {
  try {
    const { requestedProgram, requestedStudyCenter, reason } = req.body;

    if (!requestedProgram && !requestedStudyCenter) {
      return res.status(400).json({ message: "Provide requested program or study center" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const currentProgram = student.program || null;
    const currentStudyCenter = student.study_center || null;

    const request = await AcademicChangeRequest.create({
      student: student._id,
      currentProgram,
      currentStudyCenter,
      requestedProgram: requestedProgram || null,
      requestedStudyCenter: requestedStudyCenter || null,
      reason: reason || ""
    });

    res.status(201).json({
      message: "Academic change request submitted",
      requestId: request._id,
      status: request.status
    });
  } catch (err) {
    console.error("Academic change request error:", err);
    res.status(500).json({ message: "Failed to submit request" });
  }
};

/* =========================
   SUBMIT COMPLAINT
========================= */
exports.submitComplaint = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const complaint = await Complaint.create({
      studentId: student._id,
      message: subject ? `${subject}: ${message}` : message
    });

    const staffUsers = await Staff.find().select("_id").lean();
    const adminUsers = await User.find({ role: "admin" }).select("_id role").lean();
    const studentName = user.fullName || user.email || "Student";

    await notifyUsers(
      [
        ...staffUsers.map((s) => ({ id: s._id, role: "staff" })),
        ...adminUsers.map((a) => ({ id: a._id, role: "admin" }))
      ],
      "complaint",
      "New Complaint",
      `${studentName} lodged a complaint`,
      { complaintId: complaint._id }
    );

    res.status(201).json({
      message: "Complaint submitted",
      complaintId: complaint._id,
      status: complaint.status
    });
  } catch (err) {
    console.error("Complaint error:", err);
    res.status(500).json({ message: "Failed to submit complaint" });
  }
};

/* =========================
   DELETE ACCOUNT
========================= */
exports.deleteMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (student) {
      const StudentFlag = require("../models/StudentFlag");
      const ChangeRequest = require("../models/ChangeRequest");
      await AcademicChangeRequest.deleteMany({ student: student._id });
      await Complaint.deleteMany({ studentId: student._id });
      await ChangeRequest.deleteMany({ studentId: student._id });
      await StudentFlag.deleteMany({ studentId: student._id });
      await Student.findByIdAndDelete(student._id);
    }
    await User.findByIdAndDelete(user._id);

    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Failed to delete account" });
  }
};

/* =========================
   COMPLETE STUDENT SETUP
========================= */
exports.completeStudentSetup = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    Object.assign(student, req.body);
    student.profileComplete = true;
    student.profile_complete = true;
    await student.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to complete setup" });
  }
};
