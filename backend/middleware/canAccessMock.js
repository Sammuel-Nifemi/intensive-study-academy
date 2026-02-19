const {
  normalizeCourseCode,
  resolveCourseByCode,
  getStudentByUser
} = require("../utils/courseEntitlements");

module.exports = (getCourseCode) => async (req, res, next) => {
  try {
    const student = await getStudentByUser(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const courseCode = normalizeCourseCode(
      typeof getCourseCode === "function" ? getCourseCode(req) : null
    );
    if (!courseCode) return res.status(400).json({ message: "Course code is required" });

    const course = await resolveCourseByCode(courseCode);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    req.entitlementCourseCode = courseCode;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
