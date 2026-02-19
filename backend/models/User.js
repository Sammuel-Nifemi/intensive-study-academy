const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    phoneNumber: String,
    dobDay: Number,
    dobMonth: Number,
    email: { type: String, unique: true },
    password: String,

    role: {
      type: String,
      enum: ["student", "admin", "staff", "applicant"],
      default: "student"
    },

    student: Object,
    status: { type: String, default: "active" }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
