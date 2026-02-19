const StudentCourse = require("../models/StudentCourse");
const Student = require("../models/Student");

exports.saveStudentCourses = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const student = await Student.findOne({ user_id: userId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.courseSelectionLocked === true) {
      return res.status(403).json({ message: "Course selection is locked" });
    }

    const { courseIds } = req.body || {};
    if (!Array.isArray(courseIds)) {
      return res.status(400).json({ message: "courseIds must be an array" });
    }

    const uniqueCourseIds = Array.from(
      new Set(courseIds.map((id) => String(id).trim()).filter(Boolean))
    );

    await StudentCourse.deleteMany({ student_id: student._id });

    if (uniqueCourseIds.length) {
      await StudentCourse.insertMany(
        uniqueCourseIds.map((courseId) => ({
          student_id: student._id,
          course_id: courseId,
          semester: String(student.semester || "N/A").trim()
        }))
      );
    }

    student.courseSelectionLocked = true;
    await student.save();

    return res.json({
      message: "Courses saved",
      courseIds: uniqueCourseIds,
      locked: true
    });
  } catch (err) {
    console.error("Save student courses error:", err);
    return res.status(500).json({ message: "Failed to save courses" });
  }
};

exports.getStudentCourses = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const student = await Student.findOne({ user_id: userId }).select("_id courseSelectionLocked");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const records = await StudentCourse.find({ student_id: student._id }).select("course_id -_id").lean();
    const courseIds = records
      .map((item) => String(item.course_id || "").trim())
      .filter(Boolean);

    return res.json({
      courseIds,
      locked: Boolean(student.courseSelectionLocked)
    });
  } catch (err) {
    console.error("Get student courses error:", err);
    return res.status(500).json({ message: "Failed to fetch courses" });
  }
};
