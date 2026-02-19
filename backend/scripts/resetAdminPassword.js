require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const adminEmail = "oluwanifemis283@gmail.com"; // or admin@isa.com
    const newPassword = "Admin123!";    // choose something simple for now

    const hashed = await bcrypt.hash(newPassword, 10);

    const admin = await User.findOneAndUpdate(
      { email: adminEmail },
      { password: hashed },
      { new: true }
    );

    if (!admin) {
      console.log("❌ Admin not found");
    } else {
      console.log("✅ Admin password reset successfully");
      console.log("📧 Email:", adminEmail);
      console.log("🔑 New password:", newPassword);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
