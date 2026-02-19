const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reference: {
      type: String,
      unique: true,
      required: true
    },
    amount: Number,
    status: String,
    gateway: {
      type: String,
      default: "paystack"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
