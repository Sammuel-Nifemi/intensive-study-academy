const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    theme: {
      type: String,
      enum: ["emerald", "slate", "royal", "sunset", "mono"],
      default: "emerald"
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AdminSettings || mongoose.model("AdminSettings", adminSettingsSchema);
