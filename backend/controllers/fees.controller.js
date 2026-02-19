const Student = require("../models/Student");
const CurriculumCourse = require("../models/CurriculumCourse");

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const analyzeFeesData = async ({ faculty, program, level, semester }) => {
  const courses = await CurriculumCourse.find({
    faculty,
    program,
    level: Number(level),
    semester
  })
    .select("code title units courseFee examFee materialUrl")
    .sort({ code: 1 })
    .lean();

  const totalUnits = (courses || []).reduce(
    (sum, course) => sum + toNumber(course.units),
    0
  );
  const totalCourseFee = (courses || []).reduce(
    (sum, course) => sum + toNumber(course.courseFee),
    0
  );
  const totalExamFee = (courses || []).reduce(
    (sum, course) => sum + toNumber(course.examFee),
    0
  );
  const grandTotal = totalCourseFee + totalExamFee;

  return {
    courses: Array.isArray(courses) ? courses : [],
    totals: {
      totalUnits,
      totalCourseFee,
      totalExamFee,
      grandTotal
    }
  };
};

exports.analyzeFees = async (req, res) => {
  try {
    const { faculty, program, level, semester } = req.query || {};
    if (!faculty || !program || !level || !semester) {
      return res.status(400).json({ message: "faculty, program, level, semester are required" });
    }

    const payload = await analyzeFeesData({ faculty, program, level, semester });
    res.json(payload);
  } catch (err) {
    console.error("Analyze fees error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyFees = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const student = await Student.findOne({ user_id: req.user.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const profileCompleted = Boolean(
      student.profileCompleted || student.profileComplete || student.profile_complete
    );
    if (!profileCompleted) {
      return res.status(400).json({
        message: "Student profile is missing faculty, program, level, or semester."
      });
    }

    const { faculty, program, level, semester } = student;

    const payload = await analyzeFeesData({ faculty, program, level, semester });
    res.json(payload);
  } catch (err) {
    console.error("Get fees error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
