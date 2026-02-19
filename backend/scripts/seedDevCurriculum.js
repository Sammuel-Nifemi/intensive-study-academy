require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Student = require("../models/Student");
const Program = require("../models/Program");
const AdminCourse = require("../models/AdminCourse");
const ProgramCourse = require("../models/ProgramCourse");

const VALID_CATEGORIES = new Set(["compulsory", "elective"]);

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeCategory(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "compulsory";
  if (raw === "c") return "compulsory";
  if (raw === "e") return "elective";
  if (VALID_CATEGORIES.has(raw)) return raw;
  return "compulsory";
}

async function resolveProgramId(programValue) {
  if (!programValue) return null;

  if (typeof programValue === "object" && programValue !== null) {
    if (programValue._id && mongoose.isValidObjectId(programValue._id)) {
      return String(programValue._id);
    }
    if (programValue.id && mongoose.isValidObjectId(programValue.id)) {
      return String(programValue.id);
    }
  }

  if (mongoose.isValidObjectId(programValue)) {
    return String(programValue);
  }

  const programName = String(programValue).trim();
  if (!programName) return null;

  const escaped = programName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const program = await Program.findOne({
    name: { $regex: `^${escaped}$`, $options: "i" }
  })
    .select("_id")
    .lean();

  return program?._id ? String(program._id) : null;
}

async function run() {
  console.log("[seedDevCurriculum] DEV ONLY script started");
  await connectDB();

  const student = await Student.findOne({}).lean();
  if (!student) {
    console.log("[seedDevCurriculum] created: 0");
    console.log("[seedDevCurriculum] skipped: 0");
    console.log("[seedDevCurriculum] scanned: 0");
    console.log("[seedDevCurriculum] no student found");
    return;
  }

  const programId = await resolveProgramId(student.program || student.programId);
  const level = String(student.level || "").trim();
  const semester = String(student.semester || "").trim();

  if (!programId || !level || !semester) {
    console.log("[seedDevCurriculum] created: 0");
    console.log("[seedDevCurriculum] skipped: 0");
    console.log("[seedDevCurriculum] scanned: 0");
    console.log(
      "[seedDevCurriculum] first student missing valid program/level/semester profile"
    );
    return;
  }

  const adminCourses = await AdminCourse.find({})
    .select("courseCode code title category courseCategory type courseType")
    .lean();

  let created = 0;
  let skipped = 0;
  const scanned = adminCourses.length;

  for (const course of adminCourses) {
    const courseCode = normalizeCourseCode(course.courseCode || course.code);
    if (!courseCode) {
      skipped += 1;
      continue;
    }

    const category = normalizeCategory(
      course.category || course.courseCategory || course.type || course.courseType
    );

    const result = await ProgramCourse.updateOne(
      { program: programId, level, semester, courseCode },
      {
        $setOnInsert: {
          program: programId,
          level,
          semester,
          courseCode,
          title: String(course.title || "").trim(),
          category
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      created += 1;
    } else {
      skipped += 1;
    }
  }

  console.log("[seedDevCurriculum] created:", created);
  console.log("[seedDevCurriculum] skipped:", skipped);
  console.log("[seedDevCurriculum] scanned:", scanned);
}

run()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[seedDevCurriculum] failed:", err);
    try {
      await mongoose.connection.close();
    } catch (_) {
      // ignore close errors
    }
    process.exit(1);
  });
