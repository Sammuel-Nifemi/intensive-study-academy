module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({
      message: "Student access only"
    });
  }

  next();
};
