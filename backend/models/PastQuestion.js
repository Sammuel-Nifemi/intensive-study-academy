
const mongoose = require("mongoose");

const pastQuestionSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true
    },

    title: String,

    type: {
      type: String,
      enum: ["past-question", "summary"],
      required: true
    },

    fileUrl: {
      type: String,
      required: true
    },

    year: String,

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PastQuestion", pastQuestionSchema);
