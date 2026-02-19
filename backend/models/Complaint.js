const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Complaint ||
  mongoose.model("Complaint", ComplaintSchema);
