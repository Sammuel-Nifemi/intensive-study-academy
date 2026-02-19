const mongoose = require("mongoose");

const adminCourseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      trim: true,
      required: true
    },
    semester: {
      type: String,
      trim: true,
      required: true
    },
    units: {
      type: Number,
      enum: [2, 3],
      required: true
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AdminCourse ||
  mongoose.model("AdminCourse", adminCourseSchema);
