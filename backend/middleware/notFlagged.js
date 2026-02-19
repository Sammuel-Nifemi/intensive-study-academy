module.exports = (req, res, next) => {
  if (req.user.status !== "active") {
    return res.status(403).json({
      message: "Account restricted. Contact support."
    });
  }
  next();
};
