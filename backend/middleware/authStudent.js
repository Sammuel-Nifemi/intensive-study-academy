const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "No token" });
  }

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "student") {
      return res.status(403).json({ message: "Student access only" });
    }
    req.user = decoded;

    try {
      const user = await User.findById(decoded.id);
      if (user) {
        let student = await Student.findOne({ user_id: user._id });
        if (!student) {
          student = await Student.create({
            user_id: user._id,
            email: user.email,
            profileComplete: false,
            profile_complete: false
          });
        }
        req.student = student;
      }
      return next();
    } catch (err) {
      return res.status(500).json({ message: "Student lookup failed" });
    }
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
