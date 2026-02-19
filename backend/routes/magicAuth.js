const express = require("express");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const User = require("../models/User");
const { sendMail } = require("../utils/mailer");

const router = express.Router();

const { APP_BASE_URL, JWT_SECRET, SENDGRID_API_KEY } = process.env;

/* ===============================
   QUICK LOGIN (NO MAGIC LINK)
================================ */
router.post("/quick-login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    if (!JWT_SECRET) return res.status(500).json({ message: "JWT missing" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, role: "student" });
    if (!user) return res.status(404).json({ message: "Student not found" });

    let student = await Student.findOne({ user_id: user._id });
    if (!student) {
      student = await Student.create({
        user_id: user._id,
        email: user.email,
        profileComplete: false,
        profile_complete: false
      });
    }

    const sessionToken = jwt.sign(
      { id: user._id, role: "student" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token: sessionToken });
  } catch (err) {
    console.error("Quick login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   SEND MAGIC LINK
================================ */
router.post("/recovery", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    if (!JWT_SECRET) return res.status(500).json({ message: "JWT missing" });

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail, role: "student" });
    if (!user) return res.status(404).json({ message: "Student not found" });

    let student = await Student.findOne({ user_id: user._id });
    if (!student) {
      student = await Student.create({
        user_id: user._id,
        email: user.email,
        profileComplete: false,
        profile_complete: false
      });
    }

    const token = jwt.sign(
      { email: student.email, type: "magic" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const baseUrl = APP_BASE_URL || "http://localhost:5000";
    const verifyUrl = `${baseUrl}/auth/verify/${token}`;

    console.log("MAGIC LINK:", verifyUrl);

    // DEV MODE (NO EMAIL PROVIDER)
    if (!SENDGRID_API_KEY) {
      return res.json({
        message: "Magic link generated (dev mode)",
        magicLink: verifyUrl
      });
    }

    await sendMail({
      to: student.email,
      subject: "Login to Intensive Study Academy",
      text: `Click to login (15 min expiry): ${verifyUrl}`
    });

    res.json({ message: "Login link sent" });

  } catch (err) {
    console.error("Recovery error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   RESEND MAGIC LINK
================================ */
router.post("/resend", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const normalizedEmail = email.toLowerCase().trim();
    const student = await Student.findOne({ email: normalizedEmail });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const token = jwt.sign(
      { email: student.email, type: "magic" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const baseUrl = APP_BASE_URL || "http://localhost:5000";
    const verifyUrl = `${baseUrl}/auth/verify/${token}`;

    console.log("RESEND LINK:", verifyUrl);

    if (!SENDGRID_API_KEY) {
      return res.json({
        message: "Resent (dev mode)",
        magicLink: verifyUrl
      });
    }

    await sendMail({
      to: student.email,
      subject: "Your login link",
      text: verifyUrl
    });

    res.json({ message: "Login link resent" });

  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   VERIFY TOKEN
================================ */
  router.get("/verify/:token", async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, JWT_SECRET);
    if (decoded.type !== "magic") {
      return res.status(400).send("Invalid token");
    }

    const user = await User.findOne({ email: decoded.email, role: "student" });
    if (!user) return res.status(404).send("Student not found");

    let student = await Student.findOne({ user_id: user._id });
    if (!student) {
      student = await Student.create({
        user_id: user._id,
        email: user.email,
        profileComplete: false,
        profile_complete: false
      });
    }

    const sessionToken = jwt.sign(
      { id: student.user_id, role: "student" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isProfileComplete = Boolean(
      student.profileComplete || student.profile_complete
    );
    const target = isProfileComplete
      ? "/frontend/pages/student-dashboard.html"
      : "/frontend/pages/complete-profile.html";

    res.redirect(`${target}?token=${sessionToken}`);

  } catch (err) {
    console.error("Verify error:", err);
    res.status(400).send("Invalid or expired token");
  }
});

module.exports = router;
