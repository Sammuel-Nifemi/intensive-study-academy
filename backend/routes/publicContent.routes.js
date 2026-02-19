const express = require("express");
const router = express.Router();

const {
  getPublicBlogs,
  getPublicGallery
} = require("../controllers/publicContent.controller");

/* =========================
   PUBLIC CONTENT
========================= */

// Blog posts
router.get("/blogs", getPublicBlogs);

// Gallery
router.get("/gallery", getPublicGallery);

module.exports = router;
