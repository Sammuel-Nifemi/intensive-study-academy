const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
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

const questionBankSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
    questions: {
      type: [questionSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.QuestionBank || mongoose.model("QuestionBank", questionBankSchema);
