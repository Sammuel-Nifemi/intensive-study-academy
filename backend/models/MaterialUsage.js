const mongoose = require("mongoose");

const materialUsageSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    materialTitle: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["past-question", "raw-material", "mock"],
      required: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("MaterialUsage", materialUsageSchema);
