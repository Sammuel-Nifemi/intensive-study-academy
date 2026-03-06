const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Payment = require("../models/Payment");

// POST /api/payments/mock
router.post("/mock", async (req, res) => {
  try {
    const rawAmount = Number(req.body?.amount);
    const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 500;
    const reference = `TXN_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const authHeader = String(req.headers.authorization || "");
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id && decoded?.role === "student") {
          await Payment.create({
            student: decoded.id,
            reference,
            amount,
            status: "success",
            gateway: "paystack"
          });
        }
      } catch (_) {
        // Keep backward compatibility for callers without valid auth.
      }
    }

    res.json({
      status: "success",
      reference,
      amount
    });
  } catch (err) {
    console.error("Mock payment error:", err);
    res.status(500).json({ message: "Payment failed" });
  }
});

// GET /api/payments/verify/:reference
router.get("/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ reference });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "success") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
