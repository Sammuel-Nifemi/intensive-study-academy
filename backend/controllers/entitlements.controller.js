const Student = require("../models/Student");
const StudentCourse = require("../models/StudentCourse");
const StudentUsage = require("../models/StudentUsage");
const {
  normalizeCourseCode,
  resolveCourseByCode,
  getStudentByUser,
  getSelectedCourseCount,
  isCourseSelected,
  getUsedCourseCount,
  getUsageCount,
  incrementCourseUsage,
  syncEntitlement
} = require("../utils/courseEntitlements");

exports.unlockSemester = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.semesterPaid = true;
    await student.save();

    res.json({ message: "Semester unlocked", semesterPaid: true });
  } catch (err) {
    console.error("Unlock semester error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyEntitlements = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const selectedCount = await getSelectedCourseCount(student._id);
    const usedCourseCount = await getUsedCourseCount(student._id);
    const { freeCourseLimit } = await syncEntitlement(
      student._id,
      selectedCount,
      usedCourseCount
    );

    const usage = await StudentUsage.find({ studentId: student._id })
      .select("courseId productType attemptCount")
      .lean();

    res.json({
      selectedCourseCount: selectedCount,
      freeCourseLimit,
      usedCourseCount,
      usage
    });
  } catch (err) {
    console.error("Get entitlements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.consumeEntitlement = async (req, res) => {
  try {
    const { courseCode, productType } = req.body || {};
    const normalized = normalizeCourseCode(courseCode);
    const allowedTypes = new Set(["mock", "pq", "summary"]);
    if (!normalized || !allowedTypes.has(productType)) {
      return res.status(400).json({ message: "courseCode and productType are required" });
    }

    const student = await getStudentByUser(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const course = await resolveCourseByCode(normalized);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const selectedCount = await getSelectedCourseCount(student._id);
    if (!selectedCount) {
      return res.status(403).json({
        message: "Select your courses before accessing this resource."
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
        message: "Payment required to access this resource.",
        action: "PAY_2000"
      });
    }

    const limitByType = productType === "mock" ? 2 : 1;
    const usageCount = await getUsageCount(student._id, course._id, productType);
    if (usageCount >= limitByType) {
      return res.status(403).json({
        message: "Usage limit reached for this course.",
        action: "PAY_2000"
      });
    }

    const hasAnyUsageForCourse = await StudentUsage.findOne({
      studentId: student._id,
      courseId: course._id,
      attemptCount: { $gt: 0 }
    }).select("_id");

    if (!hasAnyUsageForCourse && usedCourseCount >= freeCourseLimit) {
      return res.status(403).json({
        message: "Free course limit reached. Payment required.",
        action: "PAY_2000"
      });
    }

    await incrementCourseUsage(req.user.id, productType, normalized);
    res.json({ success: true });
  } catch (err) {
    console.error("Consume entitlement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
