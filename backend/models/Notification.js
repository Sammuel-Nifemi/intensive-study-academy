const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["student", "staff", "admin"], required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    data: { type: Object }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
