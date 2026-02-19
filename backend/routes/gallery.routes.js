
const express = require("express");
const router = express.Router();

const GalleryItem = require("../models/GalleryItem");

/* =========================
   PUBLIC GALLERY
========================= */
router.get("/", async (req, res) => {
  try {
    const gallery = await GalleryItem.find()
      .sort({ createdAt: -1 });

    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch gallery" });
  }
});

module.exports = router;
