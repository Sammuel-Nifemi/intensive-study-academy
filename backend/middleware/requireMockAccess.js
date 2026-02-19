const PaymentLog = require("../models/PaymentLog");
const Student = require("../models/Student");
const StudentMockAttempt = require("../models/StudentMockAttempt");

function resolveCourseCode(req) {
  return (
    req.params?.courseCode ||
    req.params?.course ||
    req.body?.courseCode ||
    req.query?.courseCode ||
    ""
  );
}

module.exports = ({ increment = false } = {}) => async (req, res, next) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const courseCode = String(resolveCourseCode(req) || "").trim().toUpperCase();
    if (!courseCode) {
      return res.status(400).json({ message: "courseCode is required" });
    }

    const registered = (student.registeredCourses || []).map((c) => String(c).toUpperCase());
    if (!registered.includes(courseCode)) {
      const since = new Date(Date.now() - 5 * 60 * 1000);
      const paid = await PaymentLog.findOne({
        student_id: student._id,
        course_code: courseCode,
        platform: "mock",
        createdAt: { $gte: since }
      }).select("_id");

      if (!paid) {
        return res.status(402).json({
          error: "PAYMENT_REQUIRED",
          message:
            "This course was not part of your registered semester courses. Please pay ₦500."
        });
      }

      return next();
    }

    if (student.semesterPaid) {
      return next();
    }

    const attempt = await StudentMockAttempt.findOne({
      studentId: student._id,
      courseCode
    });

    const used = attempt?.attemptsUsed || 0;
    if (used >= 2) {
      return res.status(402).json({
        error: "SEMESTER_PAYMENT_REQUIRED",
        message:
          "You’ve exhausted your free attempts. Please pay ₦2000 to unlock full semester access."
      });
    }

    if (increment) {
      await StudentMockAttempt.updateOne(
        { studentId: student._id, courseCode },
        { $set: { studentId: student._id, courseCode }, $inc: { attemptsUsed: 1 } },
        { upsert: true }
      );
    }

    return next();
  } catch (err) {
    console.error("requireMockAccess error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
