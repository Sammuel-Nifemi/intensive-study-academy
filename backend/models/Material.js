const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    courseCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    level: {
      type: String,
      trim: true
    },
    semester: {
      type: String,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true
    },
    // Kept as optional metadata for admin audit trails.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdRole: {
      type: String
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    filePath: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);

