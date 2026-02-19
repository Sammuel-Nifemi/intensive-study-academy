const Staff = require("../models/Staff");

module.exports = (permission) => async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "staff") {
      return res.status(403).json({ message: "Staff only" });
    }

    const staff = await Staff.findById(req.user.id);
    if (!staff) {
      return res.status(403).json({ message: "Staff not found" });
    }

    // Profile completion gating removed. Staff access is not blocked.

    if (permission && !staff.permissions.includes(permission)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    req.staff = staff;
    next();
  } catch (err) {
    res.status(500).json({ message: "Staff verification failed" });
  }
};
