require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

(async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const email = "oluwanifemis283@gmail.com";
    const password = "yourStrongPassword"; // change this
    const fullName = "Oluwanifemi";         // REQUIRED

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "admin"
    });

    console.log("✅ Admin user created successfully");
    process.exit(0);

  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();
