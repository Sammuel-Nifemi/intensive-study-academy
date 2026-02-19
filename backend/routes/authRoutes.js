const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authRoles = require("../middleware/authRoles");

router.post("/login", authController.studentLogin);
router.post("/logout", authRoles(["admin", "staff", "student"]), authController.logout);

module.exports = router;
