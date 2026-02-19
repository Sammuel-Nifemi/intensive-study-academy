
exports.unlockSemesterAccess = async (req, res) => {
  try {
    const user = req.user;

    user.student.semesterPaid = true;

    await user.save();

    res.json({ message: "Semester access unlocked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to unlock access" });
  }
};
