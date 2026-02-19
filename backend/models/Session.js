const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  role: {
    type: String,
    enum: ["student", "staff", "admin"],
    required: true
  },
  loginAt: {
    type: Date,
    default: Date.now
  },
  logoutAt: Date,
  durationMinutes: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);
