require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connectDB = require("../config/db");
const User = require("../models/User");

async function upsertAdmin() {
  await connectDB();

  const email = "oluwanifemis283@gmail.com";
  const password = "omogbemi123";
  const fullName = "Admin User";

  const hashed = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.password = hashed;
    existing.role = "admin";
    existing.fullName = existing.fullName || fullName;
    await existing.save();
    console.log("Admin user updated:", email);
  } else {
    await User.create({
      fullName,
      email,
      password: hashed,
      role: "admin",
      status: "active"
    });
    console.log("Admin user created:", email);
  }

  await mongoose.connection.close();
}

upsertAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed admin error:", err);
    process.exit(1);
  });
