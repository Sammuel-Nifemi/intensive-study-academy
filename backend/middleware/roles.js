exports.studentOnly = (req, res, next) => {
  if (req.user.role !== "student")
    return res.status(403).json({ message: "Students only" });
  next();
};

