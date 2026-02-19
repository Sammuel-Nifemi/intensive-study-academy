require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const AdminCourse = require("../models/AdminCourse");
const ProgramCourse = require("../models/ProgramCourse");
const Program = require("../models/Program");

const isObjectId = (value) => mongoose.isValidObjectId(value);
const VALID_CATEGORIES = new Set(["compulsory", "elective"]);

function normalizeCategory(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "c") return "compulsory";
  if (raw === "e") return "elective";
  return raw;
}

async function resolveProgramId(programValue, cache) {
  if (!programValue) return null;

  if (typeof programValue === "object" && programValue !== null) {
    if (programValue._id && isObjectId(programValue._id)) return String(programValue._id);
    if (programValue.id && isObjectId(programValue.id)) return String(programValue.id);
  }

  if (isObjectId(programValue)) return String(programValue);

  const programName = String(programValue).trim();
  if (!programName) return null;
  const cacheKey = programName.toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const escaped = programName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const program = await Program.findOne({
    name: { $regex: `^${escaped}$`, $options: "i" }
  }).select("_id");

  const resolvedId = program?._id ? String(program._id) : null;
  cache.set(cacheKey, resolvedId);
  return resolvedId;
}

async function run() {
  await connectDB();

  const courses = await AdminCourse.find({}).lean();
  const programCache = new Map();
  let created = 0;
  let skipped = 0;
  let missing = 0;

  for (const course of courses) {
    const courseCode = String(course.courseCode || course.code || "").trim();
    const level = String(course.level || "").trim();
    const semester = String(course.semester || "").trim();
    const category = normalizeCategory(
      course.category || course.courseCategory || course.type || course.courseType
    );
    const programValue = course.programId || course.program;

    if (!courseCode || !level || !semester || !category || !programValue) {
      missing += 1;
      continue;
    }

    if (!VALID_CATEGORIES.has(category)) {
      missing += 1;
      continue;
    }

    const programId = await resolveProgramId(programValue, programCache);
    if (!programId) {
      missing += 1;
      continue;
    }

    const existing = await ProgramCourse.findOne({
      program: programId,
      level,
      semester,
      courseCode
    }).lean();

    if (existing) {
      skipped += 1;
      continue;
    }

    await ProgramCourse.create({
      program: programId,
      level,
      semester,
      courseCode,
      category
    });

    created += 1;
  }

  console.log("[seedProgramCourses] created:", created);
  console.log("[seedProgramCourses] skipped:", skipped);
  console.log("[seedProgramCourses] missing:", missing);
  console.log("[seedProgramCourses] scanned:", courses.length);
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error("[seedProgramCourses] failed:", err);
  process.exit(1);
});
