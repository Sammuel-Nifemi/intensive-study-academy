const mongoose = require("mongoose");

const examSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },
    
    startedAt: {
      type: Date,
      required: true
    },
    durationMinutes: {
      type: Number,
      required: true
    },
    submittedAt: Date,

    questions: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question"
  }
],
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOption: String
      }
    ],
    isSubmitted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamSession", examSessionSchema);
