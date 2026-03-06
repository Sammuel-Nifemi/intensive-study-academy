const User = require("../models/User");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utils/mailer");

function buildResetLink(token) {
  const customResetUrl = String(process.env.STUDENT_RESET_PASSWORD_URL || "").trim();
  const appBase = String(process.env.APP_BASE_URL || "").trim().replace(/\/+$/, "");
  const base =
    customResetUrl ||
    (appBase
      ? `${appBase}/frontend/pages/student-reset-password.html`
      : "http://127.0.0.1:5502/frontend/pages/student-reset-password.html");
  return `${base}?token=${encodeURIComponent(token)}`;
}

exports.registerStudent = async (req, res) => {
  try {
    const referralCodeRaw =
      req.query?.ref ||
      req.body?.ref ||
      req.body?.referralCode ||
      "";
    const referralCode = String(referralCodeRaw).trim().toUpperCase();
    const {
      email,
      fullName,
      password,
      confirmPassword
    } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedFullName = String(fullName || "").trim();
    const rawPassword = String(password || "");
    const rawConfirm = String(confirmPassword || "");

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!rawPassword) {
      return res.status(400).json({ message: "Password is required." });
    }

    if (rawPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    if (rawPassword !== rawConfirm) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await User.create({
      fullName: normalizedFullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "student",
      student: {}
    });

    let referredBy = null;
    if (referralCode) {
      const referrer = await Student.findOne({ referralCode }).select("_id");
      if (referrer?._id) {
        referredBy = referrer._id;
      }
    }

    let student = await Student.findOne({ user_id: user._id });
    if (!student) {
      student = await Student.create({
        user_id: user._id,
        email: user.email,
        referredBy,
        profileComplete: false,
        profile_complete: false
      });
    }


    res.status(201).json({
      message: "Student registered successfully",
      studentId: user._id,
      referralApplied: Boolean(referredBy),
      token: jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      )
    });
  } catch (err) {
    console.error("Student register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "");

   if (!normalizedEmail || !rawPassword) {
      return res.status(400).json({ message: "Email and password required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Authentication service not configured." });
    }

    const user = await User.findOne({ email: normalizedEmail, role: "student" });

      if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Password not set for this account."
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    let existingStudent = await Student.findOne({ user_id: user._id });
    if (!existingStudent) {
      try {
        existingStudent = await Student.create({
          user_id: user._id,
          email: user.email,
          profileComplete: false,
          profile_complete: false
        });
      } catch (createErr) {
        // Handle duplicate creation race gracefully.
        if (createErr?.code === 11000) {
          existingStudent = await Student.findOne({ user_id: user._id });
        } else {
          throw createErr;
        }
      }
    }

    if (!existingStudent) {
      return res.status(500).json({ message: "Unable to initialize student profile." });
    }

    const StudentFlag = require("../models/StudentFlag");
    const flagged = await StudentFlag.findOne({
      studentId: { $in: [existingStudent._id, user._id] }
    });
    if (flagged) {
      return res.status(403).json({ message: "Account flagged" });
    }

    let isMatch = false;
    try {
      // Normal path: bcrypt hashed password
      isMatch = await bcrypt.compare(rawPassword, String(user.password || ""));
    } catch (compareErr) {
      // Legacy fallback: plaintext password stored previously
      isMatch = String(user.password || "") === rawPassword;
      if (isMatch) {
        user.password = await bcrypt.hash(rawPassword, 10);
        await user.save();
      }
    }
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    try {
      existingStudent.lastLogin = new Date();
      existingStudent.loginCount = Number(existingStudent.loginCount || 0) + 1;
      await existingStudent.save();
    } catch (trackErr) {
      console.error("Student login tracking error:", trackErr);
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
    const debugMessage =
      process.env.NODE_ENV === "production"
        ? "Unable to login right now. Please try again."
        : `Login failed: ${err.message}`;
    res.status(500).json({ message: debugMessage });
  }
};

exports.sendResetPasswordLink = async (req, res) => {
  try {
    const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email: normalizedEmail, role: "student" });

    // Return success even when user does not exist to avoid account enumeration.
    if (!user) {
      return res.json({ success: true, message: "If the email exists, a reset link has been sent." });
    }

    const token = jwt.sign(
      { id: user._id, role: "student", type: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );
    const resetLink = buildResetLink(token);

    await sendMail({
      to: normalizedEmail,
      subject: "Reset your ISA student password",
      text: `Use this link to reset your password (valid for 30 minutes): ${resetLink}`
    });

    return res.json({ success: true, message: "If the email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Student reset-link error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.resetPasswordWithToken = async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: "Token, password and confirm password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "password_reset" || decoded.role !== "student") {
      return res.status(400).json({ message: "Invalid reset token." });
    }

    const user = await User.findOne({ _id: decoded.id, role: "student" });
    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.json({ success: true, message: "Password reset successful." });
  } catch (err) {
    console.error("Student reset-password error:", err);
    return res.status(400).json({ message: "Invalid or expired reset link." });
  }
};
