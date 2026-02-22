const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const MockAttempt = require("../models/MockAttempt");
const User = require("../models/User");
const AdminCourse = require("../models/AdminCourse");
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function generateAcademicSupportAnswer(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const systemPrompt = [
    "You are an academic tutor focused on academic improvement.",
    "Use only the student's provided exam context.",
    "Do not behave like a generic chatbot.",
    "Explain simply like a friendly tutor using 3-5 short bullet points.",
    "Avoid long academic explanations.",
    "Use plain text only. No markdown."
  ].join(" ");

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_output_tokens: 220
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      data?.error?.message || "Failed to get response from Academic Support AI";
    throw new Error(msg);
  }

  const text =
    data?.output_text ||
    data?.output?.[0]?.content?.[0]?.text ||
    "I could not generate an explanation right now.";

  return String(text).trim();
}

async function buildStudentContext(studentId) {
  const sid = new mongoose.Types.ObjectId(studentId);

  const weakAreas = await MockAttempt.aggregate([
    { $match: { studentId: sid } },
    { $unwind: "$questions" },
    { $match: { "questions.isCorrect": false } },
    {
      $project: {
        course: "$courseCode",
        topic: { $ifNull: ["$questions.topic", "General"] }
      }
    },
    {
      $group: {
        _id: { course: "$course", topic: "$topic" },
        wrongCount: { $sum: 1 }
      }
    },
    { $sort: { wrongCount: -1 } },
    { $limit: 3 }
  ]);

  const latestAttempt = await MockAttempt.findOne({ studentId: sid })
    .sort({ submittedAt: -1 })
    .lean();

  const latestWrongQuestions = (latestAttempt?.questions || [])
    .filter((q) => !q.isCorrect)
    .slice(0, 3)
    .map((q) => ({
      question: q.question,
      studentAnswer: q.studentAnswer,
      correctAnswer: q.correctAnswer,
      topic: q.topic || "General"
    }));

  return {
    hasData: Boolean(latestAttempt),
    weakAreas: weakAreas.map((row) => ({
      course: row._id.course,
      topic: row._id.topic,
      wrongCount: row.wrongCount
    })),
    latestSummary: latestAttempt
      ? {
          courseCode: latestAttempt.courseCode,
          scorePercent: latestAttempt.scorePercent,
          correct: latestAttempt.correct,
          totalQuestions: latestAttempt.totalQuestions
        }
      : null,
    latestWrongQuestions
  };
}

exports.getWeakAreas = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const rows = await MockAttempt.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId)
        }
      },
      { $unwind: "$questions" },
      { $match: { "questions.isCorrect": false } },
      {
        $project: {
          course: "$courseCode",
          topic: {
            $ifNull: ["$questions.topic", "General"]
          }
        }
      },
      {
        $group: {
          _id: { course: "$course", topic: "$topic" },
          wrongCount: { $sum: 1 }
        }
      },
      { $sort: { wrongCount: -1 } },
      { $limit: 3 },
      {
        $project: {
          _id: 0,
          course: "$_id.course",
          topic: "$_id.topic",
          wrongCount: 1
        }
      }
    ]);

    res.json(rows);
  } catch (err) {
    console.error("Academic support weak areas error:", err);
    res.status(500).json({ message: "Failed to load weak areas" });
  }
};

exports.getStudyTip = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const weakest = await MockAttempt.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId)
        }
      },
      { $unwind: "$questions" },
      { $match: { "questions.isCorrect": false } },
      {
        $project: {
          course: "$courseCode",
          topic: {
            $ifNull: ["$questions.topic", "General"]
          }
        }
      },
      {
        $group: {
          _id: { course: "$course", topic: "$topic" },
          wrongCount: { $sum: 1 }
        }
      },
      { $sort: { wrongCount: -1 } },
      { $limit: 1 }
    ]);

    if (!weakest.length) {
      return res.json({
        course: null,
        topic: null,
        wrongCount: 0,
        tip: "No weak areas detected yet. Keep practicing consistently."
      });
    }

    const row = weakest[0];
    const course = row._id.course;
    const topic = row._id.topic;
    const wrongCount = row.wrongCount;

    res.json({
      course,
      topic,
      wrongCount,
      tip: `You struggle most with ${topic}. Practice at least 2 focused drills daily in ${course}.`
    });
  } catch (err) {
    console.error("Academic support study tip error:", err);
    res.status(500).json({ message: "Failed to load study tip" });
  }
};

exports.askAcademicSupport = async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();
    const course = String(req.body?.course || "").trim();
    const studentId = req.user?.id;
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const context = await buildStudentContext(studentId);
    if (!context.hasData) {
      return res.status(200).json({
        answer: "Complete at least one mock exam first so Academic Support can give data-based guidance."
      });
    }

    const prompt = [
      course ? `Requested course: ${course}` : "",
      `Student question: ${question}`,
      "",
      `Latest mock summary: ${JSON.stringify(context.latestSummary)}`,
      `Top weak areas: ${JSON.stringify(context.weakAreas)}`,
      `Recent wrong questions: ${JSON.stringify(context.latestWrongQuestions)}`,
      "",
      "Answer with direct, brief study guidance tied to this student's weak areas."
    ]
      .filter(Boolean)
      .join("\n");

    const answer = await generateAcademicSupportAnswer(prompt);
    res.json({ answer });
  } catch (err) {
    console.error("Academic support ask error:", err);
    res.status(500).json({ message: err.message || "Failed to answer question" });
  }
};

exports.explainQuestion = async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();
    const correctAnswer = String(req.body?.correctAnswer || "").trim();
    const studentAnswer = String(req.body?.studentAnswer || "").trim();
    const studentId = req.user?.id;

    if (!question || !correctAnswer) {
      return res.status(400).json({ message: "question and correctAnswer are required" });
    }
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const context = await buildStudentContext(studentId);

    const prompt = [
      `Question: ${question}`,
      `Student answer: ${studentAnswer || "(No answer provided)"}`,
      `Correct answer: ${correctAnswer}`,
      `Student weak areas: ${JSON.stringify(context.weakAreas)}`,
      "Explain simply why the correct answer is right and give one short improvement step."
    ].join("\n");

    const explanation = await generateAcademicSupportAnswer(prompt);
    res.json({ explanation });
  } catch (err) {
    console.error("Academic support explain-question error:", err);
    res.status(500).json({ message: err.message || "Failed to explain question" });
  }
};

exports.getAdvisorObservation = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const context = await buildStudentContext(studentId);
    if (!context.hasData) {
      return res.json({
        observation:
          "I have not observed enough mock activity yet. Start one mock exam, and I will give tailored guidance."
      });
    }

    const prompt = [
      "Write one short advisor observation for this student.",
      "Tone: calm, honest, encouraging.",
      "Do not show raw stats tables.",
      "",
      `Latest mock summary: ${JSON.stringify(context.latestSummary)}`,
      `Top weak areas: ${JSON.stringify(context.weakAreas)}`,
      `Recent wrong questions: ${JSON.stringify(context.latestWrongQuestions)}`,
      "",
      "Mention one concrete daily practice step."
    ].join("\n");

    const observation = await generateAcademicSupportAnswer(prompt);
    res.json({ observation });
  } catch (err) {
    console.error("Academic advisor observation error:", err);
    res.status(500).json({ message: err.message || "Failed to load advisor observation" });
  }
};

exports.getAdvisorFeedbackForAttempt = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const attemptId = String(req.params?.attemptId || "").trim();
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }
    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ message: "Invalid attempt id" });
    }

    const [attempt, user] = await Promise.all([
      MockAttempt.findOne({
        _id: new mongoose.Types.ObjectId(attemptId),
        studentId: new mongoose.Types.ObjectId(studentId)
      }).lean(),
      User.findById(studentId).select("fullName").lean()
    ]);

    if (!attempt) {
      return res.status(404).json({ message: "Mock attempt not found" });
    }

    const studentName = String(user?.fullName || "Student")
      .trim()
      .split(/\s+/)[0] || "Student";

    const topicCounts = (attempt.questions || []).reduce((acc, q) => {
      const topic = String(q?.topic || "General").trim() || "General";
      if (!acc[topic]) {
        acc[topic] = { correct: 0, wrong: 0 };
      }
      if (q?.isCorrect) acc[topic].correct += 1;
      else acc[topic].wrong += 1;
      return acc;
    }, {});

    const weakTopics = Object.entries(topicCounts)
      .filter(([, row]) => row.wrong > 0)
      .sort((a, b) => b[1].wrong - a[1].wrong)
      .slice(0, 2)
      .map(([topic]) => topic);

    const strongTopics = Object.entries(topicCounts)
      .filter(([, row]) => row.correct > 0)
      .sort((a, b) => b[1].correct - a[1].correct)
      .slice(0, 2)
      .map(([topic]) => topic);

    const prompt = [
      "Write one short academic advisor feedback message for this mock attempt.",
      "Tone: friendly, human, encouraging, specific.",
      "Avoid raw stats, percentages, and tables.",
      "Use plain text only. No markdown.",
      "",
      `Student first name: ${studentName}`,
      `Course: ${attempt.courseCode}`,
      `Strong topics: ${JSON.stringify(strongTopics)}`,
      `Weak topics: ${JSON.stringify(weakTopics)}`,
      `Recent wrong samples: ${JSON.stringify((attempt.questions || []).filter((q) => !q.isCorrect).slice(0, 2).map((q) => ({ question: q.question, topic: q.topic || "General" })))}`,
      "",
      "Output 2-4 sentences, and include one concrete daily practice step."
    ].join("\n");

    let feedback;
    try {
      feedback = await generateAcademicSupportAnswer(prompt);
    } catch (err) {
      const weak = weakTopics[0] || "General questions";
      const strong = strongTopics[0] || "core ideas";
      feedback = `Hi ${studentName}, I reviewed your ${attempt.courseCode} mock attempt. You showed good effort in ${strong}, and I noticed you need more support in ${weak}. Practice 5 short questions daily on ${weak} and review key definitions before your next mock.`;
    }

    return res.json({
      attemptId: String(attempt._id),
      courseCode: attempt.courseCode,
      studentName,
      feedback
    });
  } catch (err) {
    console.error("Academic advisor feedback error:", err);
    return res.status(500).json({ message: err.message || "Failed to load advisor feedback" });
  }
};

exports.exportAiResponseAsPdf = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const content = String(req.body?.content || "").trim();

    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const studentName = String(req.body?.studentName || "").trim();
    const doc = new PDFDocument({
      size: "A4",
      margin: 50
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", (err) => {
      throw err;
    });
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="ai-explanation.pdf"');
      res.send(buffer);
    });

    doc.font("Helvetica-Bold").fontSize(22).fillColor("#0f172a").text(title, {
      align: "left"
    });

    if (studentName) {
      doc.moveDown(0.5);
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#475569")
        .text(`Student: ${studentName}`, { align: "left" });
    }

    doc.moveDown(1);
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    doc.font("Helvetica").fontSize(12).fillColor("#0f172a");
    if (!paragraphs.length) {
      doc.text(content.replace(/\s+/g, " ").trim(), {
        align: "left",
        lineGap: 4
      });
    } else {
      paragraphs.forEach((paragraph) => {
        doc.text(paragraph, {
          align: "left",
          lineGap: 4
        });
        doc.moveDown(0.8);
      });
    }

    const footerText = "Generated by Intensive Study Academy AI";
    const footerY = doc.page.height - 50;
    doc
      .font("Helvetica-Oblique")
      .fontSize(9)
      .fillColor("#64748b")
      .text(footerText, 50, footerY, {
        align: "center",
        width: doc.page.width - 100
      });

    doc.end();
  } catch (err) {
    console.error("Academic support export pdf error:", err);
    return res.status(500).json({ message: "Failed to export AI response as PDF" });
  }
};

exports.explainCourse = async (req, res) => {
  try {
    const courseId = String(req.body?.courseId || "").trim();
    const studentId = req.user?.id;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const course = await AdminCourse.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({
        message: "Course not supported yet. Please contact Admin."
      });
    }

    const courseTitle = String(course.title || "").trim();
    const courseCode = String(course.courseCode || "").trim().toUpperCase();
    const lowerTitle = courseTitle.toLowerCase();
    const unsupportedSubjects = ["math", "physics", "biology", "chemistry"];
    const isUnsupported = unsupportedSubjects.some((subject) => lowerTitle.includes(subject));

    if (isUnsupported) {
      return res.status(400).json({
        message: "AI support for this course is not available yet."
      });
    }

    const context = await buildStudentContext(studentId);
    const prompt = [
      "Explain this course in very simple language for a student.",
      "Format as concise sections: Course overview, Key topics, Real-life examples, How to score high.",
      "Be practical and short.",
      "",
      `Course code: ${courseCode || "N/A"}`,
      `Course title: ${courseTitle || "N/A"}`,
      context.hasData ? `Student weak areas: ${JSON.stringify(context.weakAreas)}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    const answer = await generateAcademicSupportAnswer(prompt);
    return res.json({
      courseId,
      courseCode,
      courseTitle,
      answer
    });
  } catch (err) {
    console.error("Academic support explain-course error:", err);
    return res.status(500).json({ message: err.message || "Failed to explain course" });
  }
};
