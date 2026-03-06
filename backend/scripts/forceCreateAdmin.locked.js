require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

(async () => {
  try {
    console.log("URI:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);
    console.log("CONNECTED TO ATLAS");

    const hash = await bcrypt.hash("omogbemi123", 10);

    const result = await mongoose.connection.db
      .collection("admins")
      .insertOne({
        email: "oluwanifemis283@gmail.com",
        password: hash,
        createdAt: new Date()
      });

    console.log("INSERTED ID:", result.insertedId);
    process.exit();
  } catch (err) {
    console.error("FAILED:", err);
    process.exit(1);
  }
})();
