const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    start_time: {
      type: String,
      required: true,
      trim: true
    },
    end_time: {
      type: String,
      required: true,
      trim: true
    },
    meeting_link: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.LiveClass || mongoose.model("LiveClass", liveClassSchema);
