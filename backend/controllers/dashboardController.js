const Student = require("../models/Student");

exports.getDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id })
      .populate("studyCenter");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Send student directly (frontend already expects this shape)
    res.json(student);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
