const Student = require("../models/Student");
const Course = require("../models/Course");
const StudentCourse = require("../models/StudentCourse");
const StudentUsage = require("../models/StudentUsage");
const Entitlement = require("../models/Entitlement");

function normalizeCourseCode(code) {
  return String(code || "").toUpperCase().trim();
}

async function resolveCourseByCode(courseCode) {
  const normalized = normalizeCourseCode(courseCode);
  if (!normalized) return null;
  return Course.findOne({
    $or: [{ course_code: normalized }, { code: normalized }]
  }).lean();
}

async function getStudentByUser(userId) {
  if (!userId) return null;
  return Student.findOne({ user_id: userId });
}

async function getSelectedCourseCount(studentId) {
  if (!studentId) return 0;
  return StudentCourse.countDocuments({ student_id: studentId });
}

async function isCourseSelected(studentId, courseId) {
  if (!studentId || !courseId) return false;
  const exists = await StudentCourse.findOne({
    student_id: studentId,
    course_id: courseId
  }).select("_id");
  return Boolean(exists);
}

async function getUsedCourseCount(studentId) {
  if (!studentId) return 0;
  const courseIds = await StudentUsage.distinct("courseId", {
    studentId,
    attemptCount: { $gt: 0 }
  });
  return courseIds.length;
}

async function getUsageCount(studentId, courseId, productType) {
  if (!studentId || !courseId || !productType) return 0;
  const usage = await StudentUsage.findOne({
    studentId,
    courseId,
    productType
  }).select("attemptCount");
  return usage?.attemptCount || 0;
}

async function incrementCourseUsage(userId, productType, courseCode) {
  if (!userId || !productType || !courseCode) return;
  const student = await getStudentByUser(userId);
  if (!student) return;
  const course = await resolveCourseByCode(courseCode);
  if (!course) return;

  await StudentUsage.findOneAndUpdate(
    {
      studentId: student._id,
      courseId: course._id,
      productType
    },
    { $inc: { attemptCount: 1 } },
    { upsert: true, new: true }
  );
}

async function syncEntitlement(studentId, selectedCount, usedCourseCount) {
  const freeCourseLimit = Math.floor((Number(selectedCount) || 0) / 2);
  await Entitlement.findOneAndUpdate(
    { studentId },
    { freeCourseLimit, usedCourseCount },
    { upsert: true }
  );
  return { freeCourseLimit, usedCourseCount };
}

module.exports = {
  normalizeCourseCode,
  resolveCourseByCode,
  getStudentByUser,
  getSelectedCourseCount,
  isCourseSelected,
  getUsedCourseCount,
  getUsageCount,
  incrementCourseUsage,
  syncEntitlement
};
