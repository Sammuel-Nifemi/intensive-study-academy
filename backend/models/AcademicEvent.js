const mongoose = require("mongoose");

const academicEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,
    startDate: {
      type: Date,
      required: true
    },
    // endDate: Date,
    // audience: {
    //   type: String,
    //   enum: ["students", "staff", "all"],
    //   default: "students"
    // },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcademicEvent", academicEventSchema);
