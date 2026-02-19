require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}, "email role");
  console.log(users);
  process.exit(0);
})();
