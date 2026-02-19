const mongoose = require("mongoose");

const galleryItemSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
    ,
    createdRole: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryItem", galleryItemSchema);
