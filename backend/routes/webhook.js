const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookController.paystackWebhook
);

router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  webhookController.paystackWebhook
);

module.exports = router;
