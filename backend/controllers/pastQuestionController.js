const PastQuestion = require("../models/PastQuestion");

exports.getPastQuestionsByCourse = async (req, res) => {
  try {
    const { courseCode } = req.params;

    const questions = await PastQuestion.find({
      courseCode: courseCode.toUpperCase(),
      isActive: true
    }).sort({ year: -1 });

    // Usage for PQ/Summary is recorded on access (consume endpoint)

    res.json({
      courseCode,
      count: questions.length,
      items: questions
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
