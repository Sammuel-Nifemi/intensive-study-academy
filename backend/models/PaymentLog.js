const mongoose = require("mongoose");

const paymentLogSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    course_code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    platform: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true
    },
    reference: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PaymentLog ||
  mongoose.model("PaymentLog", paymentLogSchema, "payment_logs");
