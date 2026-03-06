require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminEmail = String(process.env.ADMIN_EMAIL || process.argv[2] || "")
      .trim()
      .toLowerCase();
    const newPassword = String(process.env.ADMIN_PASSWORD || process.argv[3] || "");

    if (!adminEmail) {
      throw new Error("Provide admin email via ADMIN_EMAIL or first CLI arg.");
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error("Provide ADMIN_PASSWORD (or second CLI arg) with at least 8 characters.");
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const admin = await Admin.findOneAndUpdate(
      { email: adminEmail },
      { password: hashed },
      { new: true }
    );

    if (!admin) {
      console.log("Admin not found.");
    } else {
      console.log("Admin password reset successfully.");
      console.log("Email:", adminEmail);
    }

    process.exit(0);
  } catch (err) {
    console.error("resetAdminPassword failed:", err.message);
    process.exit(1);
  }
})();
