
module.exports = (req, res, next) => {
  const student = req.user.student;

  if (!student) {
    return res.status(403).json({ message: "Student access only" });
  }

  if (student.semesterAccess?.isActive) {
    return next();
  }

  const FREE_LIMIT = 2;

  if (student.freeAttemptsUsed < FREE_LIMIT) {
    return next();
  }

  return res.status(402).json({
    message: "Semester access required"
  });
};
