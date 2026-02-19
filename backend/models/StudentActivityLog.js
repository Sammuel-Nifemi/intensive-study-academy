const mongoose = require("mongoose");

const studentActivityLogSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  courseCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  event: {
    type: String,
    required: true,
    enum: ["mock_course_selected", "mock_started", "mock_completed"]
  },
  score: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("StudentActivityLog", studentActivityLogSchema);

