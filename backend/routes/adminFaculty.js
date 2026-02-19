const express = require("express");
const router = express.Router();
const Faculty = require("../models/Faculty");
const authAdmin = require("../middleware/authAdmin");

// CREATE
router.post("/faculties", authAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Faculty name is required" });
    }

    const existing = await Faculty.findOne({
      name: new RegExp(`^${name}$`, "i")
    });
    if (existing) {
      return res.status(409).json({ message: "Faculty already exists" });
    }

    const faculty = new Faculty({
      name,
      createdBy: req.user?.id || null
    });

    await faculty.save();
    res.json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ
router.get("/faculties", authAdmin, async (req, res) => {
  const faculties = await Faculty.find().sort({ createdAt: -1 });
  res.json(faculties);
});

// DELETE
router.delete("/faculties/:id", authAdmin, async (req, res) => {
  await Faculty.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
