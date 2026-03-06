const QuestionBank = require("../models/QuestionBank");
const CBTExam = require("../models/CBTExam");
const OpenAI = require("openai");

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const ALLOWED_DIFFICULTY = new Set(["easy", "medium", "hard"]);

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

function sanitizeQuestion(input) {
  const type = String(input?.type || "mcq").trim().toLowerCase() === "fill" ? "fill" : "mcq";
  const subject = String(input?.subject || "").trim();
  const topic = String(input?.topic || "").trim() || "General";
  const subtopic = String(input?.subtopic || "").trim() || "General";
  const rawDifficulty = String(input?.difficulty || "medium").trim().toLowerCase();
  const difficulty = ALLOWED_DIFFICULTY.has(rawDifficulty) ? rawDifficulty : "medium";
  const text = String(input?.text || "").trim();
  const options = Array.isArray(input?.options)
    ? input.options.map((opt) => String(opt || "").trim()).filter(Boolean)
    : [];
  const rawAnswer = String(input?.correctAnswer || "").trim();
  const correctAnswer = type === "mcq" ? rawAnswer.toUpperCase() : rawAnswer;
  return { type, subject, topic, subtopic, difficulty, text, options, correctAnswer };
}

function parseJsonStrict(text) {
  try {
    return JSON.parse(String(text || "").trim());
  } catch {
    throw new Error("AI response is not valid JSON.");
  }
}

function normalizeAiQuestions(payload, courseCode) {
  const source = Array.isArray(payload) ? payload : payload?.questions;
  if (!Array.isArray(source)) {
    throw new Error("AI response must be a JSON object with a questions array.");
  }

  const normalized = source.map((item, index) => {
    const q = sanitizeQuestion(item);

    if (q.type !== "mcq") {
      throw new Error(`Question ${index + 1}: type must be 'mcq'.`);
    }
    if (!q.subject) {
      throw new Error(`Question ${index + 1}: subject is required.`);
    }
    if (q.subject !== courseCode) {
      throw new Error(`Question ${index + 1}: subject must match courseCode (${courseCode}).`);
    }
    if (!q.topic) {
      throw new Error(`Question ${index + 1}: topic is required.`);
    }
    if (!q.subtopic) {
      throw new Error(`Question ${index + 1}: subtopic is required.`);
    }
    if (!ALLOWED_DIFFICULTY.has(q.difficulty)) {
      throw new Error(`Question ${index + 1}: difficulty must be easy, medium, or hard.`);
    }
    if (!q.text) {
      throw new Error(`Question ${index + 1}: text is required.`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Question ${index + 1}: options must contain at least 2 entries.`);
    }
    if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
      throw new Error(`Question ${index + 1}: correctAnswer must be A, B, C or D.`);
    }

    return q;
  });

  return normalized;
}

exports.addQuestionToBank = async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.body?.courseCode);
    const question = sanitizeQuestion(req.body);

    if (!courseCode || !question.text || !question.correctAnswer) {
      return res.status(400).json({ message: "courseCode, text and correctAnswer are required" });
    }

    if (question.type === "mcq") {
      if (question.options.length < 2) {
        return res.status(400).json({ message: "MCQ requires options" });
      }
      if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
        return res.status(400).json({ message: "MCQ correctAnswer must be A, B, C or D" });
      }
    }

    const bank = await QuestionBank.findOneAndUpdate(
      { courseCode },
      { $push: { questions: question } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      courseCode: bank.courseCode,
      totalQuestions: Array.isArray(bank.questions) ? bank.questions.length : 0
    });
  } catch (err) {
    console.error("addQuestionToBank error:", err);
    return res.status(500).json({ message: "Failed to add question to bank" });
  }
};

exports.generateMockExam = async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.body?.courseCode);
    const duration = Number(req.body?.duration) || 50;
    if (!courseCode) {
      return res.status(400).json({ message: "courseCode is required" });
    }

    const bank = await QuestionBank.findOne({ courseCode }).lean();
    const pool = Array.isArray(bank?.questions) ? [...bank.questions] : [];
    if (!pool.length) {
      return res.status(404).json({ message: "Question bank is empty for this course" });
    }

    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selected = pool.slice(0, 100);

    const exam = await CBTExam.findOneAndUpdate(
      { courseCode },
      {
        courseCode,
        duration,
        questions: selected.map((q) => ({
          type: q.type === "fill" ? "fill" : "mcq",
          subject: q.subject || courseCode,
          topic: q.topic || "General",
          subtopic: q.subtopic || "General",
          difficulty: ALLOWED_DIFFICULTY.has(String(q.difficulty || "").toLowerCase())
            ? String(q.difficulty).toLowerCase()
            : "medium",
          text: q.text,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correctAnswer
        }))
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      courseCode: exam.courseCode,
      duration: exam.duration,
      totalQuestions: Array.isArray(exam.questions) ? exam.questions.length : 0
    });
  } catch (err) {
    console.error("generateMockExam error:", err);
    return res.status(500).json({ message: "Failed to generate mock exam" });
  }
};

exports.generateQuestionsWithAi = async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(503).json({ message: "OPENAI_API_KEY is not configured." });
    }

    const courseCode = normalizeCourseCode(req.body?.courseCode);
    const prompt = String(req.body?.prompt || "").trim();
    const count = Math.max(1, Math.min(100, Number(req.body?.count) || 20));

    if (!courseCode || !prompt) {
      return res.status(400).json({ message: "courseCode and prompt are required." });
    }

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Generate academic MCQ questions and return only strict JSON. No markdown, no prose."
        },
        {
          role: "user",
          content: [
            `Course code: ${courseCode}`,
            `Question count: ${count}`,
            `Instruction: ${prompt}`,
            "Return EXACT JSON object with this shape:",
            "{",
            '  "questions": [',
            "    {",
            '      "type": "mcq",',
            `      "subject": "${courseCode}",`,
            '      "topic": "General",',
            '      "subtopic": "General",',
            '      "difficulty": "easy|medium|hard",',
            '      "text": "Question text",',
            '      "options": ["Option A", "Option B", "Option C", "Option D"],',
            '      "correctAnswer": "A|B|C|D"',
            "    }",
            "  ]",
            "}"
          ].join("\n")
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "question_generation_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    type: { type: "string", enum: ["mcq"] },
                    subject: { type: "string" },
                    topic: { type: "string" },
                    subtopic: { type: "string" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    text: { type: "string" },
                    options: { type: "array", items: { type: "string" }, minItems: 2 },
                    correctAnswer: { type: "string", enum: ["A", "B", "C", "D"] }
                  },
                  required: [
                    "type",
                    "subject",
                    "topic",
                    "subtopic",
                    "difficulty",
                    "text",
                    "options",
                    "correctAnswer"
                  ]
                }
              }
            },
            required: ["questions"]
          }
        }
      }
    });

    const content = completion?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ message: "AI returned an empty response." });
    }

    const parsed = parseJsonStrict(content);
    const validQuestions = normalizeAiQuestions(parsed, courseCode);

    const bank = await QuestionBank.findOneAndUpdate(
      { courseCode },
      { $push: { questions: { $each: validQuestions } } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      courseCode: bank.courseCode,
      inserted: validQuestions.length,
      totalQuestions: Array.isArray(bank.questions) ? bank.questions.length : 0
    });
  } catch (err) {
    console.error("generateQuestionsWithAi error:", err);
    const message = err?.message || "Failed to generate AI questions.";
    return res.status(400).json({ message });
  }
};

exports.deleteQuestionFromBank = async (req, res) => {
  try {
    const courseCode = normalizeCourseCode(req.body?.courseCode);
    const target = sanitizeQuestion(req.body);

    if (!courseCode || !target.text) {
      return res.status(400).json({ message: "courseCode and text are required" });
    }

    const bank = await QuestionBank.findOne({ courseCode });
    if (!bank) {
      return res.status(404).json({ message: "Question bank not found for course" });
    }

    const questions = Array.isArray(bank.questions) ? bank.questions : [];
    const matchIndex = questions.findIndex((q) => {
      const sameType = String(q.type || "mcq") === target.type;
      const sameText = String(q.text || "").trim() === target.text;
      const sameAnswer = String(q.correctAnswer || "").trim() === target.correctAnswer;
      const sameOptions =
        target.type === "fill" ||
        JSON.stringify(Array.isArray(q.options) ? q.options : []) === JSON.stringify(target.options);
      return sameType && sameText && sameAnswer && sameOptions;
    });

    if (matchIndex === -1) {
      return res.status(404).json({ message: "Question not found in bank" });
    }

    questions.splice(matchIndex, 1);
    bank.questions = questions;
    await bank.save();

    return res.json({
      success: true,
      courseCode: bank.courseCode,
      totalQuestions: bank.questions.length
    });
  } catch (err) {
    console.error("deleteQuestionFromBank error:", err);
    return res.status(500).json({ message: "Failed to delete question from bank" });
  }
};
