const express = require("express");
const router = express.Router();
const StudyCenter = require("../models/StudyCenter");

// GET all study centers
router.get("/", async (req, res) => {
  try {
    const centers = await StudyCenter.find().sort({ state: 1 });
    res.json(centers);
  } catch (err) {
    res.status(500).json({ message: "Failed to load study centers" });
  }
});

// ADD study center
router.post("/", async (req, res) => {
  const { state, name, city } = req.body;

  if (!name || !(city || state)) {
    return res.status(400).json({ message: "City (or state) and name are required" });
  }

  try {
    const center = await StudyCenter.create({
      name,
      city: city || state || "",
      state: state || ""
    });
    res.json(center);
  } catch (err) {
    res.status(500).json({ message: "Failed to add study center" });
  }
});

// DELETE study center
router.delete("/:id", async (req, res) => {
  try {
    await StudyCenter.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete study center" });
  }
});

module.exports = router;
