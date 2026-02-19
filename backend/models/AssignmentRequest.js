const mongoose = require("mongoose");

const assignmentRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    studentName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    studyCenter: { type: String, default: "", trim: true },
    weakTopics: { type: [String], default: [] },
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "contacted", "closed"],
      default: "pending"
    }
  },
  { timestamps: true, collection: "assignment_requests" }
);

module.exports =
  mongoose.models.AssignmentRequest ||
  mongoose.model("AssignmentRequest", assignmentRequestSchema);
