require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

async function upsertAdmin() {
  await connectDB();

  const email = "oluwanifemis283@gmail.com";
  const password = "omogbemi123";
  const hashed = await bcrypt.hash(password, 10);

  const existing = await Admin.findOne({ email });
  if (existing) {
    existing.password = hashed;
    await existing.save();
    console.log("Admin user updated:", email);
  } else {
    await Admin.create({ email, password: hashed });
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
