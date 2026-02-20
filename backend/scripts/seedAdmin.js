require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const email = String(process.env.ADMIN_EMAIL || process.argv[2] || "")
      .trim()
      .toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || process.argv[3] || "");
    const fullName = String(process.env.ADMIN_FULL_NAME || process.argv[4] || "Super Admin").trim();

    if (!email) {
      throw new Error("Provide admin email via ADMIN_EMAIL or first CLI arg.");
    }

    if (!password || password.length < 8) {
      throw new Error("Provide ADMIN_PASSWORD (or second CLI arg) with at least 8 characters.");
    }

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      process.exit(0);
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      if (existingEmail.role !== "admin") {
        console.log(`Email ${email} already exists with role=${existingEmail.role}.`);
        console.log("Use a different email or manually promote this user to admin.");
        process.exit(1);
      }
      console.log("Admin already exists with the same email.");
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      password: hashed,
      role: "admin",
      status: "active"
    });

    console.log("Admin seeded successfully:", email);
    process.exit(0);
  } catch (err) {
    console.error("seedAdmin failed:", err.message);
    process.exit(1);
  }
})();
