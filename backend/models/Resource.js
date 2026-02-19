const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    // 🔹 Course identity (human-readable)
    courseCode: {
      type: String,
      required: true, // e.g. NOU107
      uppercase: true,
      trim: true,
    },

    // 🔹 Optional reference (can be added later)
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    // 🔹 Academic details
    title: {
      type: String,
      required: true,
    },

    creditUnit: {
      type: Number,
      default: null, // e.g. 2
    },

    courseStatus: {
      type: String,
      enum: ["Compulsory", "Elective"],
      default: "Compulsory",
    },

    // 🔹 Resource info
    resourceType: {
      type: String,
      enum: ["material", "summary", "past_questions"],
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    // 🔹 Admin tracking
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
