const CBTQuestion = require("../models/CBTQuestion");
const CBTAttempt = require("../models/CBTAttempt");
const MockExam = require("../models/MockExam");
const Student = require("../models/Student");
const User = require("../models/User");
const AssignmentRequest = require("../models/AssignmentRequest");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const { incrementCourseUsage } = require("../utils/courseEntitlements");

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeAnswer(value) {
  return String(value || "").trim().toUpperCase();
}

function getTopicFromQuestion(question) {
  const topic = String(question?.topic || "").trim();
  return topic;
}

async function createAssignmentRequest({
  studentUser,
  studentProfile,
  weakTopics,
  score
}) {
  if (!weakTopics.length) return null;

  const studentName = studentUser?.fullName || "Student";
  const email = studentUser?.email || studentProfile?.email || "";
  const phone = studentUser?.phoneNumber || studentProfile?.phone || "";
  const studyCenter =
    studentProfile?.study_center ||
    studentProfile?.studyCenter ||
    studentProfile?.studyCenterId ||
    "";

  return AssignmentRequest.create({
    studentId: studentUser?._id || studentProfile?.user_id,
    studentName,
    email,
    phone,
    studyCenter,
    weakTopics,
    score
  });
}

exports.submitMockAttempt = async (req, res) => {
  try {
    const { mockId, answers, durationUsed } = req.body;
    if (!mockId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "mockId and answers are required" });
    }

    const mock = await MockExam.findById(mockId).lean();
    if (!mock || !mock.courseCode) {
      return res.status(404).json({ message: "Mock exam not found" });
    }

    const courseCode = normalizeCourseCode(mock.courseCode);
    const questionIds = answers.map((a) => a.questionId).filter(Boolean);
    const questions = await CBTQuestion.find({
      _id: { $in: questionIds },
      courseCode
    }).lean();

    if (!questions.length) {
      return res.status(400).json({ message: "Questions not found for submission" });
    }

    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    let score = 0;
    const weakTopicsSet = new Set();

    answers.forEach((item) => {
      const q = questionMap.get(String(item.questionId));
      if (!q) return;

      const studentAnswer = normalizeAnswer(item.answer);
      const correctRaw = q.correctAnswer || "";
      let isCorrect = false;

      if (q.questionType === "mcq") {
        const correct = normalizeAnswer(correctRaw);
        isCorrect = studentAnswer && studentAnswer === correct;
      } else {
        const correct = String(correctRaw || "").trim().toLowerCase();
        const given = String(item.answer || "").trim().toLowerCase();
        isCorrect = given && correct && given === correct;
      }

      if (isCorrect) {
        score += 1;
      } else {
        const topic = getTopicFromQuestion(q);
        if (topic) weakTopicsSet.add(topic);
      }
    });

    const totalQuestions = questions.length;
    const incorrectCount = totalQuestions - score;
    const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
    const studentId = req.student?._id || req.user?.id;

    await CBTAttempt.create({
      studentId,
      mockId,
      courseCode,
      score,
      totalQuestions,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer
      })),
      submittedAt: new Date(),
      durationUsed: Number(durationUsed) || 0
    });

    await incrementCourseUsage(req.user?.id || studentId, "mock", courseCode);

    const courseDoc = await Course.findOne({
      $or: [{ course_code: courseCode }, { code: courseCode }]
    }).select("_id");
    if (!courseDoc) {
      return res.status(400).json({ message: "Course not found for assignment" });
    }

    const assignment = await Assignment.create({
      studentId: req.user?.id || studentId,
      courseId: courseDoc._id,
      score,
      status: "pending"
    });

    const studentUser = await User.findById(req.user?.id || studentId).lean();
    const studentProfile = await Student.findOne({ user_id: req.user?.id || studentId }).lean();

    if (incorrectCount > 0 && weakTopicsSet.size === 0) {
      weakTopicsSet.add(courseCode);
    }

    await createAssignmentRequest({
      studentUser,
      studentProfile,
      weakTopics: Array.from(weakTopicsSet),
      score
    });

    res.json({
      score,
      totalQuestions,
      correctCount: score,
      incorrectCount,
      percentage,
      assignmentId: assignment._id
    });
  } catch (err) {
    console.error("Mock submission error:", err);
    res.status(500).json({ message: "Failed to submit mock exam" });
  }
};
