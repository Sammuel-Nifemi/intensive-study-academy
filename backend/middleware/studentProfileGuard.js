

const User = require("../models/User");
const Student = require("../models/Student");

module.exports = async (req, res, next) => {
  console.log("Student guard running");

  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
    if (!student) {
      return res.status(403).json({ message: "Complete your profile to continue" });
    }

    const profileCompleted = Boolean(
      student.profileCompleted || student.profileComplete || student.profile_complete
    );

    if (!profileCompleted) {
      return res.status(403).json({ message: "Complete your profile to continue" });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
