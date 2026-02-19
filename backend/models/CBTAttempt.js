const mongoose = require("mongoose");

const cbtAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    mockId: { type: mongoose.Schema.Types.ObjectId, index: true },
    courseCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    answers: { type: Array, default: [] },
    submittedAt: { type: Date, default: Date.now },
    durationUsed: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CBTAttempt || mongoose.model("CBTAttempt", cbtAttemptSchema);
