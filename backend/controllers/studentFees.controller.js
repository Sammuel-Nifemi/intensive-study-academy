const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const StudentCourse = require("../models/StudentCourse");
const Program = require("../models/Program");
const FeeStructure = require("../models/FeeStructure");

const UNDERGRAD_LEVELS = new Set(["100", "200", "300", "400"]);

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

exports.getStudentFees = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findOne({ user_id: user._id });
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

    const levelValue = String(student.level || "").trim();
    if (!UNDERGRAD_LEVELS.has(levelValue)) {
      return res.status(403).json({
        message: "Fee analyzer is available for undergraduate students only."
      });
    }

    let programId = student.program;
    if (programId && !mongoose.isValidObjectId(programId)) {
      const programByName = await Program.findOne({ name: programId }).select("_id name");
      if (programByName?._id) {
        programId = programByName._id;
      }
    }

    if (!programId || !mongoose.isValidObjectId(programId)) {
      return res.status(400).json({
        message: "Student program is invalid. Please contact support."
      });
    }

    const feeStructure = await FeeStructure.findOne({
      faculty: student.faculty,
      program: programId,
      level: student.level,
      semester: student.semester
    });

    if (!feeStructure) {
      return res.status(404).json({
        message: "Fee structure not found for your program and semester."
      });
    }

    const courseLinks = await StudentCourse.find({ student_id: student._id })
      .populate("course_id");
    if (!courseLinks.length) {
      return res.status(404).json({
        message: "No registered courses found for this student."
      });
    }

    const courses = [];
    let totalUnits = 0;
    let totalCoreUnits = 0;
    let totalElectiveUnits = 0;
    let totalCourseFee = 0;
    let totalExamFee = 0;

    const perUnitFee = toNumber(feeStructure.course_fee_per_unit);
    const perCourseFee = toNumber(feeStructure.perCourseFee);
    const examFeePerCourse = toNumber(
      feeStructure.perExamFee ?? feeStructure.exam_fee_per_course
    );

    courseLinks.forEach(link => {
      const course = link.course_id;
      if (!course) return;

      const unit = toNumber(course.unit ?? course.units);
      const courseType =
        course.courseType ||
        (course.type === "compulsory" ? "C" : course.type === "elective" ? "E" : "C");

      const courseFee = perUnitFee ? unit * perUnitFee : perCourseFee;
      const examFee = examFeePerCourse;

      totalUnits += unit;
      if (courseType === "C") totalCoreUnits += unit;
      if (courseType === "E") totalElectiveUnits += unit;
      totalCourseFee += courseFee;
      totalExamFee += examFee;

      courses.push({
        code: course.course_code || course.courseCode,
        title:
          course.title ||
          course.course_title ||
          course.courseCode ||
          course.course_code,
        unit,
        courseType,
        courseFee,
        examFee
      });
    });

    const otherFees = feeStructure.otherFees || {};
    const semesterFee =
      toNumber(feeStructure.semester_fee) ||
      Object.values(otherFees).reduce((sum, val) => sum + toNumber(val), 0);
    const grandTotal = totalCourseFee + totalExamFee + semesterFee;

    let programName = student.program || null;
    if (programId && mongoose.isValidObjectId(programId)) {
      const program = await Program.findById(programId).select("name");
      if (program?.name) programName = program.name;
    }

    res.json({
      student: {
        name: user.fullName || "",
        email: user.email,
        faculty: student.faculty || null,
        program: programName,
        level: student.level || null,
        semester: student.semester || null
      },
      courses,
      totals: {
        totalUnits,
        totalCoreUnits,
        totalElectiveUnits,
        totalCourseFee,
        totalExamFee,
        semesterFee,
        grandTotal
      }
    });
  } catch (err) {
    console.error("Fee analyzer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
