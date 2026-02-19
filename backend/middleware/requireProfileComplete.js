const Student = require("../models/Student");

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(403).json({ message: "Complete your profile to continue" });
    }

    const isComplete = Boolean(
      student.profileCompleted || student.profileComplete || student.profile_complete
    );

    if (!isComplete) {
      return res.status(403).json({ message: "Complete your profile to continue" });
    }

    next();
  } catch (err) {
    console.error("Profile guard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
