const PaymentLog = require("../models/PaymentLog");
const Student = require("../models/Student");

function resolveCourseCode(req) {
  return (
    req.params?.courseCode ||
    req.params?.course ||
    req.query?.courseCode ||
    req.query?.course ||
    req.body?.courseCode ||
    req.body?.course ||
    ""
  );
}

module.exports = (platform) => async (req, res, next) => {
  try {
    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const rawCode = resolveCourseCode(req);
    const courseCode = String(rawCode || "").trim().toUpperCase();
    if (!courseCode) {
      return res.status(400).json({ message: "courseCode is required" });
    }

    const registered = (student.registeredCourses || []).map((c) => String(c).toUpperCase());
    if (registered.includes(courseCode)) {
      return next();
    }

    const since = new Date(Date.now() - 5 * 60 * 1000);
    const recent = await PaymentLog.findOne({
      student_id: student._id,
      course_code: courseCode,
      platform,
      createdAt: { $gte: since }
    }).select("_id");

    if (!recent) {
      return res.status(402).json({
        error: "PAYMENT_REQUIRED",
        message:
          "This course was not part of your registered semester courses. Please pay ₦500."
      });
    }

    return next();
  } catch (err) {
    console.error("requirePayPerUse error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
