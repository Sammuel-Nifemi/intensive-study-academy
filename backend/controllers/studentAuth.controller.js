const User = require("../models/User");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerStudent = async (req, res) => {
  try {
    const {
      email,
      fullName
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = await User.create({
      fullName: fullName || "",
      email,
      role: "student",
      student: {}
    });

    let student = await Student.findOne({ user_id: user._id });

if (!student) {
  student = await Student.create({
    user_id: user._id,
    email: user.email,
    profileComplete: false,
    profile_complete: false
  });
}


    res.status(201).json({
      message: "Student registered successfully",
      studentId: user._id
    });
  } catch (err) {
    console.error("Student register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

   if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email, role: "student" });

      if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Password not set. Please use the magic login link."
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    let existingStudent = await Student.findOne({ user_id: user._id });
    if (!existingStudent) {
      existingStudent = await Student.create({
        user_id: user._id,
        email: user.email,
        profileComplete: false,
        profile_complete: false
      });
    }

    const StudentFlag = require("../models/StudentFlag");
    const flagged = await StudentFlag.findOne({
      studentId: { $in: [existingStudent._id, user._id] }
    });
    if (flagged) {
      return res.status(403).json({ message: "Account flagged" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

   res.json({
      token,
      onboardingCompleted:
        existingStudent?.profileComplete || existingStudent?.profile_complete || false
    });
  } catch (err) {
    console.error("Student login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
