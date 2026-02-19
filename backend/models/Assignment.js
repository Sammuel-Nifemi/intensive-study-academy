const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
