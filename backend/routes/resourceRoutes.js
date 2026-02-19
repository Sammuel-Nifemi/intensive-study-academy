const express = require("express");
const router = express.Router();

// Middlewares
const upload = require("../middleware/upload");
const authRoles = require("../middleware/authRoles");

// Controller
const {
  uploadResource,
} = require("../controllers/resourceController");

/*
  RESOURCE ROUTES
  ----------------
  Upload course materials, summaries, past questions
*/

// Upload resource (staff & admin)
router.post(
  "/upload",
  authRoles(["admin", "staff"]),
  upload.single("file"),
  uploadResource
);

module.exports = router;
