require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Student = require("../models/Student");

mongoose.connect(process.env.MONGO_URI);

(async () => {
  const hashed = await bcrypt.hash("123456", 10);

  await Student.create({
    fullName: "Test Student",
    email: "test@student.com",
    password: hashed,
    title: "Mr",
    faculty: "Faculty of Science",
    program: "Computer Science",
    level: "100",
    semester: "1st",
    studyCenter: "Main Center",
    role: "student"
  });

  console.log("✅ Student created successfully");
  process.exit();
})();
