const express = require("express");
const router = express.Router();
const StudyCenter = require("../models/StudyCenter");

/**
 * ✅ PUBLIC: Fetch study centres
 * /api/public/study-centers
 * /api/public/study-centers?state=Kano
 */
router.get("/public/study-centers", async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) {
      filter.city = req.query.city;
    } else if (req.query.state) {
      filter.state = req.query.state;
    }

    const centers = await StudyCenter.find(filter).sort({
      city: 1,
      name: 1
    });

    res.json(centers);
  } catch (err) {
    console.error("Study center fetch error:", err);
    res.status(500).json({ message: "Failed to load study centres" });
  }
});

module.exports = router;
