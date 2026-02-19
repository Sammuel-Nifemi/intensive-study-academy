const mongoose = require("mongoose");
const Student = require("../models/Student");
const Program = require("../models/Program");
const CourseMaterial = require("../models/CourseMaterial");
const MockExam = require("../models/MockExam");
const ExamTimetable = require("../models/ExamTimetable");

async function resolveProgramId(programValue) {
  if (!programValue) return null;
  if (mongoose.isValidObjectId(programValue)) return programValue;
  const program = await Program.findOne({ name: programValue }).select("_id");
  return program?._id || null;
}

async function getStudentProfile(req, res) {
  if (!req.user || !req.user.id) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

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

  const { faculty, program, level, semester } = student;

  const programId = await resolveProgramId(program);
  if (!programId) {
    res.status(400).json({ message: "Student program is invalid." });
    return null;
  }

  return { faculty, program: programId, level, semester };
}

async function findByProfile(Model, profile) {
  return Model.find({
    faculty: profile.faculty,
    program: profile.program,
    level: profile.level,
    semester: profile.semester
  }).sort({ createdAt: -1 });
}

exports.getMyMaterials = async (req, res) => {
  try {
    const profile = await getStudentProfile(req, res);
    if (!profile) return;
    const items = await findByProfile(CourseMaterial, profile);
    res.json(items);
  } catch (err) {
    console.error("Get materials error:", err);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
};

exports.getMyMocks = async (req, res) => {
  try {
    const profile = await getStudentProfile(req, res);
    if (!profile) return;
    const items = await findByProfile(MockExam, profile);
    res.json(items);
  } catch (err) {
    console.error("Get mocks error:", err);
    res.status(500).json({ message: "Failed to fetch mocks" });
  }
};

exports.getMyTimetables = async (req, res) => {
  try {
    const profile = await getStudentProfile(req, res);
    if (!profile) return;
    const items = await findByProfile(ExamTimetable, profile);
    res.json(items);
  } catch (err) {
    console.error("Get timetables error:", err);
    res.status(500).json({ message: "Failed to fetch timetables" });
  }
};
