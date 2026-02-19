require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const connectDB = require("./config/db");
const User = require("./models/User");

async function resetPassword() {
  try {
    await connectDB();

    const email = "student1@isa.com";
    const newPassword = "password123";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await User.updateOne(
      { email },
      { password: hashedPassword }
    );

    if (result.matchedCount === 0) {
      console.log("❌ No user found with that email");
    } else {
      console.log("✅ Password reset successful for:", email);
      console.log("➡ New password:", newPassword);
    }

    mongoose.connection.close();
  } catch (err) {
    console.error("Reset failed:", err);
    mongoose.connection.close();
  }
}

resetPassword();
