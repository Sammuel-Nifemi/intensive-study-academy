const mongoose = require("mongoose");

const AcademicChangeRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    currentProgram: { type: String, default: null },
    currentStudyCenter: { type: String, default: null },
    requestedProgram: { type: String, default: null },
    requestedStudyCenter: { type: String, default: null },
    reason: { type: String, default: "" },
    status: { type: String, default: "pending" }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AcademicChangeRequest ||
  mongoose.model("AcademicChangeRequest", AcademicChangeRequestSchema);
