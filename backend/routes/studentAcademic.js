const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const checkStudentProfileComplete = require("../middleware/checkStudentProfileComplete");

const Student = require("../models/Student");
const Program = require("../models/Program");
const CourseMaterial = require("../models/CourseMaterial");
const MockExam = require("../models/MockExam");
const ExamTimetable = require("../models/ExamTimetable");

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

router.get("/course-materials", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const profile = await getStudentProfile(req, res);
    if (!profile) return;

    const items = await CourseMaterial.find({
      faculty: profile.faculty,
      program: profile.programId,
      level: profile.level,
      semester: profile.semester
    }).sort({ createdAt: -1 });

    if (!items.length) {
      return res.status(404).json({
        message: "No course materials found for your program and semester."
      });
    }

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch course materials" });
  }
});

router.get("/mocks", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const profile = await getStudentProfile(req, res);
    if (!profile) return;

    const items = await MockExam.find({
      faculty: profile.faculty,
      program: profile.programId,
      level: profile.level,
      semester: profile.semester
    }).sort({ createdAt: -1 });

    if (!items.length) {
      return res.status(404).json({
        message: "No mock exams found for your program and semester."
      });
    }

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch mock exams" });
  }
});

router.get("/exam-timetables", authStudent, checkStudentProfileComplete, async (req, res) => {
  try {
    const profile = await getStudentProfile(req, res);
    if (!profile) return;

    const items = await ExamTimetable.find({
      faculty: profile.faculty,
      program: profile.programId,
      level: profile.level,
      semester: profile.semester
    }).sort({ createdAt: -1 });

    if (!items.length) {
      return res.status(404).json({
        message: "No exam timetables found for your program and semester."
      });
    }

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam timetables" });
  }
});

module.exports = router;
