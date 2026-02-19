const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    type: {
      type: String,
      enum: ["material", "mock", "pq", "summary"],
      required: true
    },
    file_url: {
      type: String,
      required: true,
      trim: true
    },
    locked: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Content || mongoose.model("Content", contentSchema);
