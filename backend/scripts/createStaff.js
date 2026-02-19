require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "staff@isa.com";
    const plainPassword = "password123";

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // remove existing staff if any
    await User.deleteOne({ email });

    await User.create({
      email,
      password: hashedPassword,
      role: "staff",
      isVerified: false
    });

    console.log("✅ Staff user created successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating staff:", err);
    process.exit(1);
  }
})();
