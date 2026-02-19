const mongoose = require("mongoose");

const studentCourseSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminCourse",
      required: true
    },
    semester: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

studentCourseSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

module.exports =
  mongoose.models.StudentCourse || mongoose.model("StudentCourse", studentCourseSchema);
