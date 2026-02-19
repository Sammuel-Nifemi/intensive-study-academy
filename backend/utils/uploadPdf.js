const multer = require("multer");
const path = require("path");
const fs = require("fs");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createPdfUploader(subdir = "academic") {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join("uploads", subdir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, uniqueName + path.extname(file.originalname));
    }
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedExts = new Set([".pdf", ".jpg", ".jpeg"]);
    const allowedMimes = new Set(["application/pdf", "image/jpeg"]);
    if (allowedExts.has(ext) && allowedMimes.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF or JPEG files are allowed"));
  };

  return multer({ storage, fileFilter });
}

module.exports = createPdfUploader;
