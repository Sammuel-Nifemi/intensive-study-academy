
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
console.log("✅ upload.js loaded");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "intensive-study-academy/materials",
    resource_type: "auto", // 🔥 REQUIRED for PDFs
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (better for course PDFs)
});

module.exports = upload;
