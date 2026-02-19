const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema(
  {
    faculty: {
      type: String,
      required: true,
      trim: true
    },
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
    perCourseFee: {
      type: Number,
      required: true,
      min: 0
    },
    perExamFee: {
      type: Number,
      required: true,
      min: 0
    },
    otherFees: {
      type: Object,
      default: {}
    },
    // Backward compatible fields (optional)
    course_fee_per_unit: {
      type: Number,
      min: 0
    },
    exam_fee_per_course: {
      type: Number,
      min: 0
    },
    semester_fee: {
      type: Number,
      min: 0
    }
  },
  { timestamps: true }
);

feeStructureSchema.index(
  { faculty: 1, program: 1, level: 1, semester: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.FeeStructure || mongoose.model("FeeStructure", feeStructureSchema);
