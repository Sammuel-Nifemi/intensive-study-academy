const PastQuestion = require("../models/PastQuestion");
const MaterialUsage = require("../models/MaterialUsage");

exports.getPastQuestionsByCourse = async (req, res) => {
  try {
    const { courseCode } = req.params;

    const questions = await PastQuestion.find({
      courseCode: courseCode.toUpperCase(),
      isActive: true
    }).sort({ year: -1 });

    if (req.student?._id && Array.isArray(questions) && questions.length) {
      const first = questions[0];
      try {
        await MaterialUsage.create({
          student: req.student._id,
          materialId: first._id,
          materialTitle: first.title || `${courseCode.toUpperCase()} Past Questions`,
          type: "past-question"
        });
      } catch (usageErr) {
        console.error("Past question usage write failed:", usageErr);
      }
    }

    res.json({
      courseCode,
      count: questions.length,
      items: questions
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
