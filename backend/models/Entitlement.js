const mongoose = require("mongoose");

const entitlementSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true
    },
    freeCourseLimit: {
      type: Number,
      default: 0
    },
    usedCourseCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true, collection: "entitlement" }
);

module.exports =
  mongoose.models.Entitlement || mongoose.model("Entitlement", entitlementSchema);
