require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const email = String(process.env.ADMIN_EMAIL || process.argv[2] || "")
      .trim()
      .toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || process.argv[3] || "");

    if (!email) {
      throw new Error("Provide admin email via ADMIN_EMAIL or first CLI arg.");
    }

    if (!password || password.length < 8) {
      throw new Error("Provide ADMIN_PASSWORD (or second CLI arg) with at least 8 characters.");
    }

    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      process.exit(0);
    }

    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      console.log("Admin already exists with the same email.");
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);

    await Admin.create({ email, password: hashed });

    console.log("Admin seeded successfully:", email);
    process.exit(0);
  } catch (err) {
    console.error("seedAdmin failed:", err.message);
    process.exit(1);
  }
})();
