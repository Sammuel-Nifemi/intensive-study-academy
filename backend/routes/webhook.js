const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

router.post(
  "/paystack",
  express.json({ verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }}),
  webhookController.paystackWebhook
);

module.exports = router;
