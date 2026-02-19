const Student = require("../models/Student");

// =======================
// GET LOGGED IN STUDENT
// =======================

exports.getMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id }).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// COMPLETE STUDENT SETUP
// =======================

exports.completeStudentSetup = async (req, res) => {
  try {
    const updates = req.body;

    const student = await Student.findOneAndUpdate(
      { user_id: req.user.id },
      updates,
      { new: true }
    );

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Setup failed" });
  }
};
