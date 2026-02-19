const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

summarySchema.index({ courseCode: 1 });

module.exports = mongoose.models.Summary || mongoose.model("Summary", summarySchema);
