const mongoose = require("mongoose");

const staffAnnouncementSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.StaffAnnouncement ||
  mongoose.model("StaffAnnouncement", staffAnnouncementSchema);
