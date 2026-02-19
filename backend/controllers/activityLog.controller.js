const StudentActivityLog = require("../models/StudentActivityLog");

exports.logStudentActivity = async (req, res) => {
  try {
    const courseCode = String(req.body?.courseCode || "").trim().toUpperCase();
    const event = String(req.body?.event || "").trim();
    const score = req.body?.score;

    if (!courseCode || !event) {
      return res.status(400).json({ message: "courseCode and event are required" });
    }

    const payload = {
      studentId: req.user.id,
      courseCode,
      event
    };

    if (score !== undefined && score !== null && score !== "") {
      payload.score = Number(score);
    }

    await StudentActivityLog.create(payload);
    return res.json({ success: true });
  } catch (err) {
    console.error("logStudentActivity error:", err);
    return res.status(500).json({ message: "Failed to log activity" });
  }
};

