const mongoose = require("mongoose");

const curriculumCourseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    faculty: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    program: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: Number,
      required: true
    },
    semester: {
      type: String,
      enum: ["First", "Second"],
      required: true
    },
    units: {
      type: Number,
      enum: [2, 3],
      required: true
    },
    courseFee: {
      type: Number,
      required: true,
      default: 0
    },
    examFee: {
      type: Number,
      required: true,
      default: 0
    },
    materialUrl: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CurriculumCourse ||
  mongoose.model("CurriculumCourse", curriculumCourseSchema);
