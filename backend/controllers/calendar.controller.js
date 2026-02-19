const AcademicEvent = require("../models/AcademicEvent");

exports.getStudentCalendar = async (req, res) => {
  try {
    const events = await AcademicEvent.find({
      audience: { $in: ["students", "all"] },
      isActive: true
    }).sort({ startDate: 1 });

    res.json(events);
  } catch (err) {
    console.error("Calendar error:", err);
    res.status(500).json({ message: "Failed to load calendar" });
  }
};
