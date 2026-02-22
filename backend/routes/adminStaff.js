const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const authAdmin = require("../middleware/authAdmin");
const Staff = require("../models/Staff");
const { generateOtp, generateTempPassword, normalizeOtp } = require("../utils/staffAuth");
const { sendMail } = require("../utils/mailer");

router.post("/staff", authAdmin, async (req, res) => {
  try {
    const { email, permissions } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await Staff.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Staff already exists" });
    }

    const tempPassword = generateTempPassword();
    const otpCode = generateOtp();

    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const hashedOtp = await bcrypt.hash(normalizeOtp(otpCode), 10);

    const perms = Array.isArray(permissions) && permissions.length
      ? permissions
      : ["materials", "mocks", "cbt"];

    const staff = await Staff.create({
      email: normalizedEmail,
      password: hashedPassword,
      permissions: perms,
      createdBy: req.user.id,
      passwordResetRequired: true,
      otpHash: hashedOtp,
      otpExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      otpPurpose: "onboarding"
    });

    const emailText = [
      "Your staff account has been created.",
      "",
      `Email: ${staff.email}`,
      `Temporary Password: ${tempPassword}`,
      `OTP Code: ${otpCode}`,
      "Login link: http://localhost:5000/pages/staff-login.html",
      "",
      "This code expires in 7 days."
    ].join("\n");

    const mailResult = await sendMail({
      to: staff.email,
      subject: "Staff Account Created",
      text: emailText
    });
    const mailSent = mailResult?.sent === true;
    const mailError = mailSent
      ? null
      : (mailResult?.error || (mailResult?.disabled ? "Email disabled" : "Failed to send staff email"));

    const response = {
      message: mailSent
        ? "Staff created successfully"
        : "Staff created, but email failed to send",
      mailSent,
      mailError,
      id: staff._id,
      email: staff.email,
      role: staff.role,
      permissions: staff.permissions,
      createdBy: staff.createdBy
    };

    if (!mailSent) {
      response.otp = otpCode;
      response.tempPassword = tempPassword;
    }

    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: "Failed to create staff" });
  }
});

router.get("/staff", authAdmin, async (req, res) => {
  try {
    const staff = await Staff.find().select("-password").sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});

router.delete("/staff/:id", authAdmin, async (req, res) => {
  try {
    const removed = await Staff.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.json({ message: "Staff deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete staff" });
  }
});

module.exports = router;
