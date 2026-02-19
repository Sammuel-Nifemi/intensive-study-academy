const mongoose = require("mongoose");

const cbtQuestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["mcq", "fill"],
      default: "mcq"
    },
    text: { type: String, required: true, trim: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const cbtExamSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
    duration: {
      type: Number,
      required: true
    },
    questions: {
      type: [cbtQuestionSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.CBTExam || mongoose.model("CBTExam", cbtExamSchema);
