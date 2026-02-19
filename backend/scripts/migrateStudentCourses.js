require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const StudentCourse = require("../models/StudentCourse");
const AdminCourse = require("../models/AdminCourse");
const Course = require("../models/Course");

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

async function run() {
  await connectDB();

  const records = await StudentCourse.find({}).lean();
  const adminCodeCache = new Map();
  let total = 0;
  let migrated = 0;
  let skipped = 0;
  let unresolved = 0;

  for (const record of records) {
    total += 1;
    const currentId = record.course_id;
    if (!currentId) {
      unresolved += 1;
      continue;
    }

    const courseId = String(currentId);

    if (mongoose.isValidObjectId(courseId)) {
      const existingAdmin = await AdminCourse.findById(courseId).select("_id").lean();
      if (existingAdmin) {
        skipped += 1;
        continue;
      }
    } else {
      unresolved += 1;
      continue;
    }

    const legacyCourse = await Course.findById(courseId).lean();
    if (!legacyCourse) {
      unresolved += 1;
      continue;
    }

    const courseCode = normalizeCode(
      legacyCourse.course_code || legacyCourse.code || legacyCourse.courseCode || ""
    );
    if (!courseCode) {
      unresolved += 1;
      continue;
    }

    let adminCourseId = adminCodeCache.get(courseCode);
    if (!adminCourseId) {
      const adminCourse = await AdminCourse.findOne({ courseCode }).select("_id").lean();
      adminCourseId = adminCourse?._id ? String(adminCourse._id) : null;
      adminCodeCache.set(courseCode, adminCourseId);
    }

    if (!adminCourseId) {
      unresolved += 1;
      continue;
    }

    await StudentCourse.updateOne(
      { _id: record._id, course_id: { $ne: adminCourseId } },
      { $set: { course_id: adminCourseId } }
    );
    migrated += 1;
  }

  console.log("[migrateStudentCourses] total:", total);
  console.log("[migrateStudentCourses] migrated:", migrated);
  console.log("[migrateStudentCourses] skipped:", skipped);
  console.log("[migrateStudentCourses] unresolved:", unresolved);
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error("[migrateStudentCourses] failed:", err);
  process.exit(1);
});
