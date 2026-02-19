const mongoose = require("mongoose");

const mockAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    correct: {
      type: Number,
      required: true
    },
    wrong: {
      type: Number,
      required: true
    },
    scorePercent: {
      type: Number,
      required: true
    },
    timeSpentSeconds: {
      type: Number,
      default: 0
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    questions: {
      type: [
        {
          questionId: String,
          topic: String,
          question: String,
          studentAnswer: String,
          correctAnswer: String,
          explanation: String,
          isCorrect: Boolean
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

mockAttemptSchema.index({ studentId: 1, courseCode: 1, submittedAt: -1 });

module.exports =
  mongoose.models.MockAttempt || mongoose.model("MockAttempt", mockAttemptSchema);
