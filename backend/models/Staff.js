const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["staff"], default: "staff" },
    permissions: {
      type: [String],
      default: ["materials", "mocks", "cbt"]
    },
    fullName: { type: String, trim: true },
    title: { type: String, trim: true },
    staffRole: { type: String, trim: true },
    dobDay: { type: Number },
    dobMonth: { type: Number },
    faculty: { type: String, trim: true },
    program: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    birthday: {
      day: { type: Number },
      month: { type: Number }
    },
    phone: { type: String, trim: true },
    profileCompleted: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    inAppNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    deactivationRequested: { type: Boolean, default: false },
    passwordResetRequired: { type: Boolean, default: false },
    otpHash: { type: String },
    otpExpiresAt: { type: Date },
    otpPurpose: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
