const mongoose = require("mongoose");

const examTimetableSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    faculty: { type: String, required: true, trim: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
    level: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseCode: { type: String, trim: true }
  },
  { timestamps: true }
);

examTimetableSchema.index({ faculty: 1, program: 1, level: 1, semester: 1 });
examTimetableSchema.index({ courseCode: 1 });

module.exports =
  mongoose.models.ExamTimetable || mongoose.model("ExamTimetable", examTimetableSchema);
