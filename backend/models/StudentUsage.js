const mongoose = require("mongoose");

const studentUsageSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    productType: {
      type: String,
      enum: ["mock", "pq", "summary"],
      required: true
    },
    attemptCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true, collection: "student_usage" }
);

studentUsageSchema.index(
  { studentId: 1, courseId: 1, productType: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.StudentUsage || mongoose.model("StudentUsage", studentUsageSchema);
