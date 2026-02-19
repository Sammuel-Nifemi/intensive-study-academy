require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const AdminCourse = require("../models/AdminCourse");
const CurriculumCourse = require("../models/CurriculumCourse");

function getUnits(course) {
  const explicit = Number(course.units);
  if (explicit === 2 || explicit === 3) return explicit;
  return null;
}

async function migrate() {
  await connectDB();

  const courses = await AdminCourse.find().lean();
  if (!courses.length) {
    console.log("No AdminCourse records found.");
    await mongoose.connection.close();
    return;
  }

  const bulk = CurriculumCourse.collection.initializeUnorderedBulkOp();
  courses.forEach((course) => {
    const code = String(course.courseCode || course.code || "").trim().toUpperCase();
    if (!code) return;

    const units = getUnits(course);
    if (!units) {
      console.warn(`Skipping ${code}: units missing (must be 2 or 3).`);
      return;
    }

    bulk
      .find({ code })
      .upsert()
      .updateOne({
        $set: {
          code,
          title: course.title || course.name || "",
          faculty: course.faculty || "",
          department: course.department || "",
          program: course.program || "",
          level: Number(course.level) || 0,
          semester: course.semester || "First",
          units,
          courseFee: Number(course.courseFee) || 0,
          examFee: Number(course.examFee) || 0,
          materialUrl: course.materialUrl || "",
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      });
  });

  if (bulk.length === 0) {
    console.log("No valid courses to migrate.");
    await mongoose.connection.close();
    return;
  }

  const result = await bulk.execute();
  console.log("Migration complete:", result?.nUpserted ?? 0, "upserts");
  await mongoose.connection.close();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  mongoose.connection.close();
});
