const mongoose = require("mongoose");

const courseMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    faculty: { type: String, required: true, trim: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
    level: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    filePath: { type: String, trim: true },
    materialType: {
      type: String,
      enum: ["lecture", "past-question", "summary"],
      default: "lecture"
    },
    files: { type: [String], default: [] },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseCode: { type: String, trim: true }
  },
  { timestamps: true }
);

courseMaterialSchema.index({ faculty: 1, program: 1, level: 1, semester: 1 });
courseMaterialSchema.index({ courseCode: 1 });

module.exports =
  mongoose.models.CourseMaterial || mongoose.model("CourseMaterial", courseMaterialSchema);
