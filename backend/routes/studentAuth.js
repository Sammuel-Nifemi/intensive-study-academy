const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
// const Staff = require("../models/Staff"); // adjust if needed

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // const staff = await Staff.findOne({ email });
    // if (!staff) {
    //   return res.status(401).json({ message: "Invalid credentials" });
    // }

    const isMatch = await staff.comparePassword(password); 
    // or bcrypt.compare(password, staff.password)

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ CREATE JWT HERE
    const token = jwt.sign(
      { id: staff._id, role: "staff" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ SEND TOKEN TO FRONTEND
    res.json({
      message: "Login successful",
      token,
      staffId: staff._id,
      isVerified: true
    });

  } catch (err) {
    console.error("Staff login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
