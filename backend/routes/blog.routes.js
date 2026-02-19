const express = require("express");
const router = express.Router();

const BlogPost = require("../models/BlogPost");

/* =========================
   PUBLIC BLOG
========================= */
router.get("/", async (req, res) => {
  try {
    const posts = await BlogPost.find({ published: true })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blog posts" });
  }
});

module.exports = router;
