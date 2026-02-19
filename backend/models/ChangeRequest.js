const mongoose = require("mongoose");

const changeRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    type: { type: String, enum: ["program", "studyCenter"], required: true },
    value: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ChangeRequest || mongoose.model("ChangeRequest", changeRequestSchema);
