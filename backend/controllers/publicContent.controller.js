
const Blog = require("../models/Blog");
const Gallery = require("../models/Gallery");

/* =========================
   PUBLIC: READ BLOG POSTS
========================= */
exports.getPublicBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blog posts" });
  }
};

/* =========================
   PUBLIC: READ GALLERY ITEMS
========================= */
exports.getPublicGallery = async (req, res) => {
  try {
    const gallery = await Gallery.find({ visibility: "public" })
      .sort({ createdAt: -1 });

    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch gallery items" });
  }
};
