const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const authController = require("../controllers/authController");
const authRoles = require("../middleware/authRoles");
const authStudent = require("../middleware/authStudent");
const User = require("../models/user"); // ADD THIS AT TOP

/* ======================
   TEMP SEED ROUTES
   ====================== */

router.post("/seed-admin", async (req, res) => {
  try {
    const exists = await User.findOne({ email: "admin@isa.com" });
    if (exists) return res.json({ message: "Admin already exists" });

    const hashed = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      fullName: "Super Admin",
      email: "admin@isa.com",
      password: hashed,
      role: "admin"
    });

    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: "Seed admin failed" });
  }
});


const Student = require("../models/Student");

router.get("/student-me", authStudent, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id })
      .populate("studyCenter")
      .select({ password: 0 });


    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load student" });
  }
});

/* ======================
   AUTH ROUTES
   ====================== */

router.post("/login", authController.login);
router.post("/admin/login", authController.adminLogin);
router.post("/staff/login", authController.staffLogin);
router.post("/staff/verify-otp", authController.staffVerifyOtp);
router.post("/staff/reset-password", authController.staffResetPassword);
router.post("/staff/forgot-password", authController.staffForgotPassword);
router.post("/student-login", authController.studentLogin); // student-only
router.post("/register", authController.register);
router.post("/logout", authRoles(["admin", "staff", "student"]), authController.logout);
router.get("/me", authRoles(["admin", "staff", "student"]), authController.getMe);


module.exports = router;
