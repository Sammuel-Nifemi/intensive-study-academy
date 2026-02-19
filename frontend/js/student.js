
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  getMyProfile,
  completeStudentSetup
} = require("../controllers/studentController");

// Get logged-in student profile
router.get("/me", auth, getMyProfile);

// Complete onboarding / setup
router.post("/setup", auth, completeStudentSetup);

module.exports = router;
