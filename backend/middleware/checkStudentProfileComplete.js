const Student = require("../models/Student");

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

module.exports = async (req, res, next) => {
  try {
    const student =
      req.student || (await Student.findOne({ user_id: req.user.id }).lean());

    if (!student) {
      return res.status(403).json({
        message: "Student profile not found",
        redirectUrl: "/frontend/pages/complete-profile.html"
      });
    }

    const profileCompleted =
      Boolean(student.profileCompleted) ||
      Boolean(student.profileComplete) ||
      Boolean(student.profile_complete);

    if (!profileCompleted) {
      return res.status(403).json({
        message: "Complete your profile to continue",
        redirectUrl: "/frontend/pages/complete-profile.html"
      });
    }

    return next();
  } catch (err) {
    console.error("Profile completion check failed", err);
    return res.status(500).json({ message: "Profile check failed" });
  }
};
