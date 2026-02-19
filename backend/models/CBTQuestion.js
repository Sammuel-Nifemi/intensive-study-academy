const mongoose = require("mongoose");

const cbtQuestionSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    questionText: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ["mcq", "fill"],
      required: true
    },
    options: {
      type: [String],
      default: []
    },
    correctAnswer: {
      type: String,
      default: ""
    },
    topic: {
      type: String,
      default: "",
      trim: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CBTQuestion || mongoose.model("CBTQuestion", cbtQuestionSchema);
