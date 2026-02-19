const mongoose = require("mongoose");

const programCourseSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true
    },
    level: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: String,
      required: true,
      trim: true
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      enum: ["compulsory", "elective"],
      required: true
    }
  },
  { timestamps: true }
);

programCourseSchema.index(
  { program: 1, level: 1, semester: 1, courseCode: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.ProgramCourse ||
  mongoose.model("ProgramCourse", programCourseSchema);
