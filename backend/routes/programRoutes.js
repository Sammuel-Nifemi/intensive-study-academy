const express = require("express");
const router = express.Router();

const Program = require("../models/Program");
const StudyCenter = require("../models/StudyCenter");
const authAdmin = require("../middleware/authAdmin");

// CREATE PROGRAM
router.post("/programs", authAdmin, async (req, res) => {
  try {
    const { name, facultyId } = req.body;
    if (!name || !facultyId) {
      return res.status(400).json({ message: "Program name and faculty are required" });
    }

    const existing = await Program.findOne({
      facultyId,
      name: new RegExp(`^${String(name).trim()}$`, "i")
    });
    if (existing) {
      return res.status(409).json({ message: "Program already exists for this faculty" });
    }

    const program = await Program.create({
      name: String(name).trim(),
      facultyId,
      faculty: facultyId
    });

    res.json(program);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET PROGRAMS
router.get("/programs", authAdmin, async (req, res) => {
  try {
    const programs = await Program.find()
      .populate("facultyId", "name")
      .lean();
    const formatted = programs.map((p) => ({
      _id: p._id,
      name: p.name,
      facultyId: p.facultyId?._id || p.facultyId || null,
      facultyName: p.facultyId?.name || "",
      faculty: p.facultyId
        ? { _id: p.facultyId?._id || p.facultyId, name: p.facultyId?.name || "" }
        : null
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ======================
// GET ALL STUDY CENTERS
// ======================
router.get("/study-centers", authAdmin, async (req, res) => {
  try {
    const centers = await StudyCenter.find().sort({ createdAt: -1 });
    res.json(centers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch centers" });
  }
});

// ======================
// CREATE STUDY CENTER
// ======================
router.post("/study-centers", authAdmin, async (req, res) => {
  try {
    const { name, city } = req.body;
    if (!name || !city) {
      return res.status(400).json({ message: "Center name and city are required" });
    }

    const existing = await StudyCenter.findOne({
      name: new RegExp(`^${String(name).trim()}$`, "i")
    });
    if (existing) {
      return res.status(409).json({ message: "Study center already exists" });
    }

    const center = await StudyCenter.create({
      name: String(name).trim(),
      city: String(city).trim()
    });

    res.json(center);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to create" });
  }
});

// ======================
// DELETE STUDY CENTER
// ======================
router.delete("/study-centers/:id", authAdmin, async (req, res) => {
  await StudyCenter.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});



// DELETE PROGRAM
router.delete("/programs/:id", authAdmin, async (req, res) => {
  await Program.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
