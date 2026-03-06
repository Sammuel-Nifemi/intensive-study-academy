require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const ADMIN_EMAIL = "oluwanifemis283@gmail.com";
const ADMIN_PASSWORD = "omogbemi123";
const SALT_ROUNDS = 10;

async function seedSingleAdmin() {
  await connectDB();

  const existingAdmin = await Admin.findOne().lean();
  if (existingAdmin) {
    console.log("Admin already exists. No changes made.");
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  await Admin.create({
    role: "admin",
    email: ADMIN_EMAIL.toLowerCase().trim(),
    password: hashedPassword
  });

  console.log("Admin created successfully.");
}

async function run() {
  try {
    await seedSingleAdmin();
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
