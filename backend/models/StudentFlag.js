const mongoose = require("mongoose");

const studentFlagSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    reason: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.StudentFlag || mongoose.model("StudentFlag", studentFlagSchema);
