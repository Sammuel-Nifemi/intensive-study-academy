
const express = require("express");
const router = express.Router();

const upload = require("../utils/upload");
const Material = require("../models/Material");
const CourseMaterial = require("../models/CourseMaterial");
const authAdmin = require("../middleware/authAdmin");
const authRoles = require("../middleware/authRoles");

function normalizePath(p) {
  if (!p) return null;
  const normalized = String(p).replace(/\\/g, "/").replace(/^\/+/, "");
  return `/${normalized}`;
}

function toPublicMaterial(material) {
  const fileUrl = material.fileUrl || material.filePath || "";
  return {
    _id: String(material._id),
    title: material.title || "Untitled",
    description: material.description || "",
    courseCode: material.courseCode || "",
    level: material.level || "",
    semester: material.semester || "",
    fileUrl: normalizePath(fileUrl) || "",
    createdAt: material.createdAt || material.updatedAt || new Date(0)
  };
}

/* ============================
   UPLOAD MATERIAL (ADMIN & STAFF)
============================ */
router.post(
  "/upload",
  authRoles(["admin", "staff"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File upload failed" });
      }

      const { title, description, courseCode, level, semester } = req.body;
      const user = req.user;
      if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required" });
      }

      const material = await Material.create({
        title: title.trim(),
        description: description.trim(),
        courseCode: String(courseCode || "").trim().toUpperCase(),
        level: String(level || "").trim(),
        semester: String(semester || "").trim(),
        fileUrl: normalizePath(req.file.path),
        filePath: req.file.path,
        uploadedBy: user.id,
        createdBy: user.id,
        createdRole: user.role
      });

      res.json({ message: "Upload successful", material });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);


/* ============================
   GET PENDING MATERIALS (ADMIN)
============================ */
router.get("/pending", authAdmin, async (req, res) => {

  const materials = await Material.find({ status: "pending" })
    .populate("uploadedBy", "name email")
    .sort({ createdAt: -1 });

  res.json(materials);
});

/* ============================
   APPROVE MATERIAL (ADMIN)
============================ */
router.put("/:id/approve", authAdmin, async (req, res) => {

  const material = await Material.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );

  res.json({ message: "Approved", material });
});

/* ============================
   REJECT MATERIAL (ADMIN)
============================ */
router.put("/:id/reject", authAdmin, async (req, res) => {

  await Material.findByIdAndDelete(req.params.id);
  res.json({ message: "Rejected & removed" });
});

router.get("/my-materials", authRoles(["admin", "staff"]), async (req, res) => {
  const materials = await Material.find({
    uploadedBy: req.user.id
  }).sort({ createdAt: -1 });

  res.json(materials);
});

/* ============================
   PUBLIC MATERIAL LIBRARY
============================ */
router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const query = { status: { $ne: "rejected" } };
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { courseCode: { $regex: q, $options: "i" } }
      ];
    }

    const items = await Material.find(query)
      .select("title description courseCode fileUrl createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(items.map(toPublicMaterial));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

// GET /api/materials/public
// Public endpoint: returns all materials (newest first), no faculty/program filtering.
router.get("/public", async (req, res) => {
  try {
    const [legacyItems, academicItems] = await Promise.all([
      Material.find({ status: { $ne: "rejected" } })
        .select("title description courseCode level semester fileUrl createdAt")
        .lean(),
      CourseMaterial.find({})
        .select("title description courseCode level semester fileUrl createdAt")
        .lean()
    ]);

    const items = [...academicItems, ...legacyItems]
      .map(toPublicMaterial)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Material.findOne({
      _id: req.params.id,
      status: { $ne: "rejected" }
    })
      .select("title description courseCode fileUrl createdAt")
      .lean();

    if (!item) {
      return res.status(404).json({ message: "Material not found" });
    }

    res.json(toPublicMaterial(item));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch material" });
  }
});



module.exports = router;
