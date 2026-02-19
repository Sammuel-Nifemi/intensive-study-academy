const mongoose = require("mongoose");

const studentMockAttemptSchema = new mongoose.Schema(
  {
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
    attemptsUsed: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

studentMockAttemptSchema.index({ studentId: 1, courseCode: 1 }, { unique: true });

module.exports =
  mongoose.models.StudentMockAttempt ||
  mongoose.model("StudentMockAttempt", studentMockAttemptSchema);
