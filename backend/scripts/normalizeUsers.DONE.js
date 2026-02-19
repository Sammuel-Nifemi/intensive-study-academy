

console.log("🔥 normalizeUsers.js file loaded");

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  try {
    console.log("🚀 Starting user normalization script...");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = await User.find();
    console.log(`🔍 Found ${users.length} users`);

    for (const user of users) {
      // Move loose semesterAccess into student
      if (user.semesterAccess) {
        user.student = user.student || {};
        user.student.semesterAccess = user.semesterAccess;
        user.semesterAccess = undefined;
      }

      // Remove student object from non-students
      if (user.role !== "student") {
        user.student = undefined;
      }

      try {
      await user.save({ validateBeforeSave: false });
    } catch (err) {
      console.error(`⚠️ Skipped user ${user._id}: ${err.message}`);
    }
  }
    console.log("✅ User normalization complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error normalizing users:", err);
    process.exit(1);
  }
})();
