require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

(async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const email = "oluwanifemis283@gmail.com";
    const password = "yourStrongPassword"; // change this
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({ email, password: hashedPassword });

    console.log("✅ Admin user created successfully");
    process.exit(0);

  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();
