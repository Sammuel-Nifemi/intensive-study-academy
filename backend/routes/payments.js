const express = require("express");
const router = express.Router();

// POST /api/payments/mock
router.post("/mock", async (req, res) => {
  try {
    const rawAmount = Number(req.body?.amount);
    const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 500;
    const reference = `TXN_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
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

module.exports = router;
