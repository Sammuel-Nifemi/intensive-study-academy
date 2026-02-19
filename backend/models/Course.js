const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program"
    },
    code: {
      type: String,
      uppercase: true,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    course_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    faculty: {
      type: String,
      required: true,
      trim: true
    },
    program: {
      type: String,
      required: true,
      trim: true
    },
    unit: {
      type: Number,
      required: true,
      min: 0
    },
    semester: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      required: true,
      trim: true
    },
    courseType: {
      type: String,
      enum: ["C", "E"]
    },
    type: {
      type: String,
      enum: ["compulsory", "elective"],
      required: true
    }
  },
  { timestamps: true }
);

courseSchema.index({ code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Course || mongoose.model("Course", courseSchema);
