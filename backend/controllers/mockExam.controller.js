const MockExam = require("../models/MockExam");
const CBTExam = require("../models/CBTExam");
const QuestionBank = require("../models/QuestionBank");
const ExamAttempt = require("../models/ExamAttempt");
const MockAttempt = require("../models/MockAttempt");
const User = require("../models/User");
const StudentFlag = require("../models/StudentFlag");

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildStableQuestionId(source, originalIndex, question) {
  const text = String(question?.text || question?.question || "").trim();
  const type = question?.type === "fill" ? "fill" : "mcq";
  return `${source}:${originalIndex}:${type}:${text.slice(0, 80)}`;
}

exports.getMockExam = async (req, res) => {
  try {
    const course = String(req.params.course || "").toUpperCase().trim();
    if (!course) return res.status(400).json({ message: "Course is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }
    const flagged = await StudentFlag.findOne({ studentId: user._id });
    if (flagged) {
      return res.status(403).json({ message: "Account flagged" });
    }

    const exam = await MockExam.findOne({ courseCode: course });
    if (exam) {
      const shuffled = shuffle(exam.questions);
      const questions = shuffled.map((q, idx) => ({
        id: q._id,
        number: idx + 1,
        question: q.question,
        options: q.options,
        type: q.type
      }));

      return res.json({
        courseCode: exam.courseCode,
        source: "mock",
        questions
      });
    }

    // Fallback: allow exams generated from QuestionBank -> CBTExam
    const cbtExam = await CBTExam.findOne({ courseCode: course }).lean();
    const questionBank =
      !cbtExam || !Array.isArray(cbtExam.questions) || !cbtExam.questions.length
        ? await QuestionBank.findOne({ courseCode: course }).lean()
        : null;

    const sourceQuestions =
      cbtExam && Array.isArray(cbtExam.questions) && cbtExam.questions.length
        ? cbtExam.questions
        : Array.isArray(questionBank?.questions)
          ? questionBank.questions
          : [];

    if (!sourceQuestions.length) {
      return res.status(404).json({ message: "Mock exam not found" });
    }

    const sourceEntries = sourceQuestions.map((q, originalIndex) => ({
      q,
      originalIndex
    }));
    const shuffled = shuffle(sourceEntries);
    const questions = shuffled.map(({ q, originalIndex }, idx) => {
      const qType = q.type === "fill" ? "fill" : "mcq";
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const options =
        qType === "mcq"
          ? rawOptions.map((opt, i) => ({
              label: String.fromCharCode(65 + i),
              text: String(opt || "")
            }))
          : [];
      return {
        id: buildStableQuestionId(cbtExam ? "cbt" : "question_bank", originalIndex, q),
        number: idx + 1,
        question: q.text,
        options,
        type: qType
      };
    });

    return res.json({
      courseCode: course,
      source: cbtExam ? "cbt" : "question_bank",
      questions
    });
  } catch (err) {
    console.error("Get mock exam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.submitMockExam = async (req, res) => {
  try {
    const { courseCode, answers, timeSpentSeconds } = req.body;
    const course = String(courseCode || "").toUpperCase().trim();

    if (!course || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Course and answers are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }
    const flagged = await StudentFlag.findOne({ studentId: user._id });
    if (flagged) {
      return res.status(403).json({ message: "Account flagged" });
    }

    const existingAttempts = await ExamAttempt.countDocuments({
      studentId: user._id,
      course
    });

    const exam = await MockExam.findOne({ courseCode: course });
    const cbtExam = exam ? null : await CBTExam.findOne({ courseCode: course }).lean();
    const questionBank =
      exam || cbtExam ? null : await QuestionBank.findOne({ courseCode: course }).lean();
    if (!exam && !cbtExam && !questionBank) {
      return res.status(404).json({ message: "Mock exam not found" });
    }

    const questionMap = new Map();
    if (exam) {
      exam.questions.forEach((q) => {
        questionMap.set(String(q._id), q);
      });
    } else if (cbtExam && Array.isArray(cbtExam.questions)) {
      cbtExam.questions.forEach((q, idx) => {
        questionMap.set(buildStableQuestionId("cbt", idx, q), q);
      });
    } else if (questionBank && Array.isArray(questionBank.questions)) {
      questionBank.questions.forEach((q, idx) => {
        questionMap.set(buildStableQuestionId("question_bank", idx, q), q);
      });
    }

    let correctCount = 0;
    const explanations = [];
    const detailedQuestions = [];
    const answerMap = new Map(
      answers.map((ans) => [String(ans.id), (ans.answer ?? "").toString()])
    );

    answers.forEach((ans, idx) => {
      const q = questionMap.get(String(ans.id));
      if (!q) return;

      const provided = (ans.answer ?? "").toString();
      let isCorrect = false;

      const qType = q.type === "fill" ? "fill" : "mcq";
      if (qType === "mcq") {
        const normalized = provided.trim().toUpperCase();
        isCorrect = normalized === q.correctAnswer.toString().trim().toUpperCase();
      } else {
        const normalized = provided.trim().toLowerCase();
        const correct = q.correctAnswer.toString().trim().toLowerCase();
        isCorrect = normalized === correct;
      }

      if (isCorrect) correctCount += 1;

      let correctText = q.correctAnswer;
      if (qType === "mcq" && Array.isArray(q.options)) {
        // MockExam options are [{label,text}], CBTExam options are ["..."]
        if (q.options.length && typeof q.options[0] === "object") {
          const match = q.options.find((opt) => opt.label === q.correctAnswer);
          if (match && match.text) correctText = match.text;
        } else {
          const letter = String(q.correctAnswer || "").toUpperCase().charCodeAt(0) - 65;
          if (Number.isInteger(letter) && letter >= 0 && letter < q.options.length) {
            correctText = q.options[letter];
          }
        }
      }

      explanations.push({
        number: idx + 1,
        question: q.question || q.text,
        topic: String(q.topic || "General").trim() || "General",
        type: qType,
        correctAnswer: q.correctAnswer,
        correctText,
        explanation: q.explanation || correctText,
        isCorrect
      });

      detailedQuestions.push({
        questionId: String(ans.id),
        topic: String(q.topic || "General").trim() || "General",
        question: q.question || q.text,
        studentAnswer: provided || "",
        correctAnswer: String(correctText || q.correctAnswer || ""),
        explanation: q.explanation || String(correctText || q.correctAnswer || ""),
        isCorrect
      });
    });

    const attemptNumber = existingAttempts + 1;
    const normalizedTimeSpent = Math.max(0, Number(timeSpentSeconds) || 0);
    const totalQuestions = exam
      ? exam.questions.length
      : cbtExam
        ? cbtExam.questions.length
        : questionBank.questions.length;
    const wrongCount = Math.max(0, totalQuestions - correctCount);
    const scorePercent =
      totalQuestions > 0
        ? Number(((correctCount / totalQuestions) * 100).toFixed(1))
        : 0;
    const examId = exam?._id || cbtExam?._id || questionBank?._id;
    const submittedAt = new Date();

    await ExamAttempt.create({
      studentId: user._id,
      course,
      score: correctCount,
      attempts: attemptNumber,
      timeSpentSeconds: normalizedTimeSpent
    });

    const persistedAttempt = await MockAttempt.create({
      studentId: user._id,
      examId,
      courseCode: course,
      totalQuestions,
      correct: correctCount,
      wrong: wrongCount,
      scorePercent,
      timeSpentSeconds: normalizedTimeSpent,
      submittedAt,
      questions: detailedQuestions
    });

    res.json({
      score: correctCount,
      total: totalQuestions,
      attempts: attemptNumber,
      timeSpentSeconds: normalizedTimeSpent,
      explanations,
      attempt: {
        attemptId: String(persistedAttempt._id),
        studentId: String(user._id),
        examId: String(examId),
        courseCode: course,
        totalQuestions,
        correct: correctCount,
        wrong: wrongCount,
        scorePercent,
        timeSpentSeconds: normalizedTimeSpent,
        submittedAt: submittedAt.toISOString(),
        questions: detailedQuestions.map((item) => ({
          ...item,
          studentAnswer: item.studentAnswer || answerMap.get(item.questionId) || ""
        }))
      }
    });
  } catch (err) {
    console.error("Submit mock exam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
