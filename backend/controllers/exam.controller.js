const ExamSession = require("../models/ExamSession");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const User = require("../models/User");
const ExamResult = require("../models/ExamResult");


/* =========================
   START EXAM
========================= */
exports.startExam = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    // 🚦 EXAM GATE
    const canTakeExams =
      user.student.profileCompleted &&
      user.student.registeredCourses.length > 0;

    if (!canTakeExams) {
      return res.status(403).json({
        message: "Complete onboarding before taking exams"
      });
    }

    const { examId } = req.params;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Prevent multiple attempts
    const existingSession = await ExamSession.findOne({
      student: user._id,
      exam: examId,
      isSubmitted: false
    });

    if (existingSession) {
      return res.json({
        message: "Exam already in progress",
        sessionId: existingSession._id,
        startedAt: existingSession.startedAt,
        durationMinutes: existingSession.durationMinutes
      });
    }

    // 🔒 FREEZE QUESTIONS (✅ CORRECT PLACE)
    const questions = await Question.find({
      course: exam.course
    }).limit(exam.totalQuestions);

    const session = await ExamSession.create({
      student: user._id,
      exam: exam._id,
      startedAt: new Date(),
      durationMinutes: exam.durationMinutes,
      questions: questions.map(q => q._id)
    });

    res.json({
      message: "Exam started",
      sessionId: session._id,
      startedAt: session.startedAt,
      durationMinutes: session.durationMinutes
    });
  } catch (err) {
    console.error("Start exam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   SUBMIT EXAM
========================= */
exports.submitExam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, answers } = req.body;

    const session = await ExamSession.findOne({
      _id: sessionId,
      student: userId,
      isSubmitted: false
    }).populate("questions");

    if (!session) {
      return res.status(404).json({
        message: "Active exam session not found"
      });
    }

    // Save answers
    session.answers = answers || [];
    session.isSubmitted = true;
    session.submittedAt = new Date();
    await session.save();

    // 🧮 SCORING LOGIC
    let score = 0;

    session.questions.forEach(question => {
      const userAnswer = session.answers.find(
        a => a.questionId.toString() === question._id.toString()
      );

      if (
        userAnswer &&
        userAnswer.selectedOption === question.correctOption
      ) {
        score++;
      }
    });

    // Prevent duplicate results
    const existingResult = await ExamResult.findOne({
      student: userId,
      exam: session.exam
    });

    if (!existingResult) {
      await ExamResult.create({
        student: userId,
        exam: session.exam,
        session: session._id,
        score,
        totalQuestions: session.questions.length
      });
    }

    res.json({
      message: "Exam submitted & scored",
      score,
      totalQuestions: session.questions.length
    });
  } catch (err) {
    console.error("Submit exam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
