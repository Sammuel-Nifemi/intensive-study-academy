const mongoose = require("mongoose");

const ExamAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: String, required: true },
    score: { type: Number, required: true },
    attempts: { type: Number, required: true },
    timeSpentSeconds: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ExamAttempt || mongoose.model("ExamAttempt", ExamAttemptSchema);
