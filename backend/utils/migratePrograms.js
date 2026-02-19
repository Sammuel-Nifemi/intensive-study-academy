const mongoose = require("mongoose");
require("dotenv").config();

const Program = require("../models/Program");
const AdminCourse = require("../models/AdminCourse");

const PROGRAM_MAP = {
  Economics: { facultyName: "Social Sciences", facultyId: "SOC" },
  "Business Administration": { facultyName: "Management Sciences", facultyId: "MGMT" },
  "Peace and Conflict Resolution": { facultyName: "Social Sciences", facultyId: "SOC" }
};

function toFacultyId(name) {
  const cleaned = String(name || "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
  return cleaned.slice(0, 4) || "GEN";
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const courses = await AdminCourse.find({}, "program faculty").lean();
  const facultyByProgram = new Map();
  courses.forEach((course) => {
    const programName = String(course.program || "").trim();
    if (!programName || !course.faculty) return;
    if (!facultyByProgram.has(programName)) {
      facultyByProgram.set(programName, course.faculty);
    }
  });

  const programs = await Program.find();
  for (const program of programs) {
    if (program.facultyId && program.facultyName) {
      continue;
    }

    const mapped = PROGRAM_MAP[program.name];
    let facultyName = mapped?.facultyName || facultyByProgram.get(program.name) || "";
    let facultyId = mapped?.facultyId || toFacultyId(facultyName);

    if (!facultyName) {
      console.warn(`Skipping ${program.name}: no faculty found`);
      continue;
    }

    program.facultyName = facultyName;
    program.facultyId = facultyId;
    await program.save();
    console.log(`Updated ${program.name} -> ${facultyName} (${facultyId})`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
