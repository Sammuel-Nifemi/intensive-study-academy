const express = require("express");
const router = express.Router();

const authAdmin = require("../middleware/authAdmin");
const authRoles = require("../middleware/authRoles");
const upload = require("../utils/upload");

const Material = require("../models/Material");
const Announcement = require("../models/Announcement");
const BlogPost = require("../models/BlogPost");
const GalleryItem = require("../models/GalleryItem");

function normalizePath(p) {
  return p ? `/${p.replace(/\\/g, "/")}` : null;
}

/* =========================
   MATERIALS (ADMIN)
========================= */
router.post("/materials", authRoles(["admin", "staff"]), upload.single("file"), async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
      return res.status(403).json({ message: "Admin or staff only" });
    }
    if (!req.file) return res.status(400).json({ message: "File upload failed" });

    const { title, description, courseCode } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const material = await Material.create({
      title: title.trim(),
      description: description.trim(),
      courseCode: String(courseCode || "").trim().toUpperCase(),
      filePath: req.file.path,
      fileUrl: normalizePath(req.file.path),
      status: "approved",
      uploadedBy: req.user.id,
      createdBy: req.user.id,
      createdRole: req.user.role
    });

    res.status(201).json({ message: "Material uploaded", material });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

router.get("/materials", authAdmin, async (req, res) => {
  try {
    const materials = await Material.find().populate("createdBy", "fullName email");
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

router.put("/materials/:id", authAdmin, async (req, res) => {
  try {
    const { title, description, courseCode } = req.body;
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        courseCode: String(courseCode || "").trim().toUpperCase()
      },
      { new: true }
    );
    res.json(material);
  } catch (err) {
    res.status(500).json({ message: "Failed to update material" });
  }
});

router.delete("/materials/:id", authAdmin, async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete material" });
  }
});

/* =========================
   ANNOUNCEMENTS (ADMIN)
========================= */
router.post("/announcements", authRoles(["admin", "staff"]), async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
      return res.status(403).json({ message: "Admin or staff only" });
    }
    const { title, message, target } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const announcement = await Announcement.create({
      title,
      message,
      target: target || "all",
      createdBy: req.user.id,
      createdRole: req.user.role
    });

    res.status(201).json({ message: "Announcement created", announcement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create announcement" });
  }
});

router.get("/announcements", authAdmin, async (req, res) => {
  try {
    const items = await Announcement.find().populate("createdBy", "fullName email");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

router.put("/announcements/:id", authAdmin, async (req, res) => {
  try {
    const { title, message, target } = req.body;
    const item = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, message, target },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to update announcement" });
  }
});

router.delete("/announcements/:id", authAdmin, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete announcement" });
  }
});

/* =========================
   BLOG (ADMIN)
========================= */
router.post("/blog", authRoles(["admin", "staff"]), upload.single("coverImage"), async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
      return res.status(403).json({ message: "Admin or staff only" });
    }
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const coverImage = req.file ? normalizePath(req.file.path) : null;

    const post = await BlogPost.create({
      title,
      content,
      coverImage,
      createdBy: req.user.id,
      createdRole: req.user.role,
      published: true
    });

    res.status(201).json({ message: "Blog post created", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create blog post" });
  }
});

router.get("/blog", authAdmin, async (req, res) => {
  try {
    const posts = await BlogPost.find().populate("createdBy", "fullName email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blog posts" });
  }
});

router.put("/blog/:id", authAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to update blog post" });
  }
});

router.delete("/blog/:id", authAdmin, async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete blog post" });
  }
});

/* =========================
   GALLERY (ADMIN)
========================= */
router.post("/gallery", authRoles(["admin", "staff"]), upload.single("image"), async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
      return res.status(403).json({ message: "Admin or staff only" });
    }
    if (!req.file) return res.status(400).json({ message: "Image upload failed" });

    const { caption } = req.body;
    const imageUrl = normalizePath(req.file.path);

    const item = await GalleryItem.create({
      imageUrl,
      caption,
      createdBy: req.user.id,
      createdRole: req.user.role
    });

    res.status(201).json({ message: "Gallery image uploaded", item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload gallery image" });
  }
});

router.get("/gallery", authAdmin, async (req, res) => {
  try {
    const items = await GalleryItem.find().populate("createdBy", "fullName email");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch gallery items" });
  }
});

router.delete("/gallery/:id", authAdmin, async (req, res) => {
  try {
    await GalleryItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Gallery item deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete gallery item" });
  }
});

module.exports = router;
