const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty"
    }
  },
  { timestamps: true }
);

programSchema.index({ facultyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Program", programSchema);
