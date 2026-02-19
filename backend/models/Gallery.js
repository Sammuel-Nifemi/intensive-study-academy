const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  fileUrl: {
    type: String,
    required: true
  },

  fileType: {
    type: String,
    enum: ["image", "pdf"],
    required: true
  },

  visibility: {
    type: String,
    enum: ["public", "private"],
    default: "public"
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Gallery", gallerySchema);
