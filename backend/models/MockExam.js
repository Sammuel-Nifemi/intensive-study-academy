const mongoose = require("mongoose");

const mockExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    faculty: { type: String, required: true, trim: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
    level: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    files: { type: [String], default: [] },
    description: { type: String, trim: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseCode: { type: String, trim: true }
  },
  { timestamps: true }
);

mockExamSchema.index({ faculty: 1, program: 1, level: 1, semester: 1 });
mockExamSchema.index({ courseCode: 1 });

module.exports = mongoose.models.MockExam || mongoose.model("MockExam", mockExamSchema);
