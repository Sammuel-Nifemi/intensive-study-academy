const express = require("express");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");

const router = express.Router();

/**
 * @route   POST /api/students/register
 * @desc    Register a new student
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      title,
      faculty,
      program,
      level,
      semester,
      studyCenter,
    } = req.body;

    // Validate
    if (
      !email ||
      !password ||
      !title ||
      !faculty ||
      !program ||
      !level ||
      !semester ||
      !studyCenter
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check if student exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(409).json({
        message: "Student with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create student
    const student = await Student.create({
      email,
      password: hashedPassword,
      title,
      faculty,
      program,
      level,
      semester,
      studyCenter,
    });

    return res.status(201).json({
      message: "Student registered successfully",
      studentId: student._id,
    });
  } catch (error) {
    console.error("Student registration error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

/**
 * @route   POST /api/students/login
 * @desc    Login student
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find student
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Login successful
    return res.status(200).json({
      message: "Login successful",
      studentId: student._id,
      role: student.role,
    });

  } catch (error) {
    console.error("Student login error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});



module.exports = router;
