
const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true
    },
    status: { type: String, default: "active" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
