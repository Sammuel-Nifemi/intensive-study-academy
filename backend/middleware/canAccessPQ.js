const {
  normalizeCourseCode,
  resolveCourseByCode,
  getStudentByUser,
  getSelectedCourseCount,
  isCourseSelected,
  getUsedCourseCount,
  getUsageCount,
  syncEntitlement
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

    const selectedCount = await getSelectedCourseCount(student._id);
    if (!selectedCount) {
      return res.status(403).json({
        message: "Select your courses before accessing past questions."
      });
    }

    const selected = await isCourseSelected(student._id, course._id);
    if (!selected) {
      return res.status(403).json({
        message: "This course is not in your selected courses."
      });
    }

    const usedCourseCount = await getUsedCourseCount(student._id);
    const { freeCourseLimit } = await syncEntitlement(
      student._id,
      selectedCount,
      usedCourseCount
    );

    if (freeCourseLimit <= 0) {
      return res.status(403).json({
        message: "Payment required to access past questions.",
        action: "PAY_2000"
      });
    }

    const usageCount = await getUsageCount(student._id, course._id, "pq");
    if (usageCount >= 1) {
      return res.status(403).json({
        message: "Past question limit reached for this course.",
        action: "PAY_2000"
      });
    }

    const hasAnyUsageForCourse =
      (await getUsageCount(student._id, course._id, "mock")) > 0 ||
      (await getUsageCount(student._id, course._id, "pq")) > 0 ||
      (await getUsageCount(student._id, course._id, "summary")) > 0;
    if (!hasAnyUsageForCourse && usedCourseCount >= freeCourseLimit) {
      return res.status(403).json({
        message: "Free course limit reached. Payment required.",
        action: "PAY_2000"
      });
    }

    req.entitlementCourseCode = courseCode;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
