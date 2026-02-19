
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Staff = require("../models/Staff");
const { generateOtp, normalizeOtp } = require("../utils/staffAuth");
const { sendMail } = require("../utils/mailer");


// =========================
// LOGIN
// =========================

// =========================
// GENERAL LOGIN (ADMIN / STAFF / STUDENT)
// =========================



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      email: user.email
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// ADMIN LOGIN (ADMIN ONLY)
// =========================
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: "admin" });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      email: user.email
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// STAFF LOGIN (STAFF ONLY)
// =========================
exports.staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const staff = await Staff.findOne({ email: String(email || "").trim().toLowerCase() });

    if (!staff) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, staff.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (staff.passwordResetRequired) {
      return res.json({
        otpRequired: true,
        message: "OTP verification required"
      });
    }

    const token = jwt.sign(
      { id: staff._id, role: "staff" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: "staff",
      email: staff.email,
      permissions: staff.permissions
    });
  } catch (err) {
    console.error("Staff login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.staffVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const staff = await Staff.findOne({ email: String(email || "").trim().toLowerCase() });

    if (!staff || !staff.otpHash || !staff.otpExpiresAt) {
      return res.status(400).json({ message: "OTP not available" });
    }

    if (staff.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const normalized = normalizeOtp(otp);
    const isMatch = await bcrypt.compare(normalized, staff.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};

exports.staffResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const staff = await Staff.findOne({ email: String(email || "").trim().toLowerCase() });
    if (!staff || !staff.otpHash || !staff.otpExpiresAt) {
      return res.status(400).json({ message: "OTP not available" });
    }

    if (staff.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const normalized = normalizeOtp(otp);
    const isMatch = await bcrypt.compare(normalized, staff.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    staff.password = await bcrypt.hash(newPassword, 10);
    staff.passwordResetRequired = false;
    staff.otpHash = undefined;
    staff.otpExpiresAt = undefined;
    staff.otpPurpose = undefined;
    await staff.save();

    const token = jwt.sign(
      { id: staff._id, role: "staff" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Password reset successful",
      token,
      role: "staff",
      email: staff.email,
      permissions: staff.permissions
    });
  } catch (err) {
    res.status(500).json({ message: "Password reset failed" });
  }
};

exports.staffForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const staff = await Staff.findOne({ email: String(email || "").trim().toLowerCase() });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const otpCode = generateOtp();
    staff.otpHash = await bcrypt.hash(normalizeOtp(otpCode), 10);
    staff.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    staff.otpPurpose = "forgot";
    staff.passwordResetRequired = true;
    await staff.save();

    const emailText = [
      "Your password reset code is: " + otpCode,
      "This code expires in 15 minutes."
    ].join("\n");

    await sendMail({
      to: staff.email,
      subject: "Staff Password Reset",
      text: emailText
    });

    res.json({ message: "OTP sent to staff email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to process request" });
  }
};


exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

exports.studentLogin = async (req, res) => {
  try {
    const { email, matricNumber, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }
    console.log("LOGIN BODY:", req.body);


    const user = await User.findOne({
  email,
  role: "student-me",
  status: "active"
});

console.log("USER FOUND:", !!user);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 👇 PLACE LOGS HERE
    console.log("PASSWORD PROVIDED:", password);
    console.log("HASH IN DB:", user.password);

    // 🔐 First login check ONLY if explicitly false
    if (user.student-me?.onboardingCompleted === false) {
      if (!matricNumber) {
        return res.status(400).json({
          message: "Matric number is required for first login"
        });
      }

      if (
        user.student-me.matricNumber.trim().toUpperCase() !==
        matricNumber.trim().toUpperCase()
      ) {
        return res.status(401).json({
          message: "Invalid matric number"
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      onboardingCompleted: user.student-me?.onboardingCompleted ?? true
    });
  } catch (err) {
    console.error("Student login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// =========================
// REGISTER (WITH REFERRAL)
// =========================

exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const role = "applicant";
    const refCode = req.query.ref; // ✅ FIXED

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let referredBy = null;

    if (refCode) {
      const refUser = await User.findOne({ referralCode: refCode });
      if (refUser) {
        referredBy = refUser._id;
        refUser.referralCount += 1;
        await refUser.save();
      }
    }

    // ✅ SIMPLIFIED (role is always applicant)
    const referralCode = `ISA-APP-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      referralCode,
      referredBy
    });

    res.status(201).json({
      message: "Registration successful",
      referralCode: user.referralCode
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};




// =========================
// LOGOUT
// =========================
exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// =========================
// GET CURRENT USER
// =========================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

