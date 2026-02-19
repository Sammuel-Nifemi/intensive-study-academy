require("dotenv").config();
const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const MockExam = require("../models/MockExam");

async function seed() {
  const seedPath = path.join(__dirname, "gst105.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  const payload = JSON.parse(raw);

  await connectDB();

  const update = {
    courseCode: payload.courseCode,
    questions: payload.questions
  };

  await MockExam.findOneAndUpdate(
    { courseCode: payload.courseCode },
    update,
    { upsert: true, new: true }
  );

  console.log(`Seeded mock exam for ${payload.courseCode}`);
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
