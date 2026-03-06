require("dotenv").config();

const mongoose = require("mongoose");
const OpenAI = require("openai");
const connectDB = require("../config/db");
const QuestionBank = require("../models/QuestionBank");

const ALLOWED_DIFFICULTY = new Set(["easy", "medium", "hard"]);
const REQUEST_DELAY_MS = Number(process.env.AI_CLASSIFY_DELAY_MS || 700);
const MAX_RETRIES = Number(process.env.AI_CLASSIFY_MAX_RETRIES || 3);
const MODEL = process.env.AI_CLASSIFY_MODEL || "gpt-4o-mini";

function isMissing(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function hasCompleteMetadata(question) {
  const difficulty = String(question?.difficulty || "").toLowerCase();
  return (
    !isMissing(question?.subject) &&
    !isMissing(question?.topic) &&
    !isMissing(question?.subtopic) &&
    ALLOWED_DIFFICULTY.has(difficulty)
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseClassification(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const topic = String(parsed?.topic || "").trim();
  const subtopic = String(parsed?.subtopic || "").trim();
  const difficulty = String(parsed?.difficulty || "")
    .trim()
    .toLowerCase();

  if (!topic) throw new Error("Missing topic");
  if (!subtopic) throw new Error("Missing subtopic");
  if (!ALLOWED_DIFFICULTY.has(difficulty)) {
    throw new Error("Invalid difficulty");
  }

  return { topic, subtopic, difficulty };
}

async function classifyQuestion(openai, questionText) {
  const prompt = `You are an academic classification system.
Given the question below, return STRICT JSON only:

{
  "topic": "...",
  "subtopic": "...",
  "difficulty": "easy | medium | hard"
}

Question:
${questionText}

Do not include explanation. Only valid JSON.`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response from OpenAI");

      return parseClassification(content);
    } catch (err) {
      const isLastTry = attempt === MAX_RETRIES;
      if (isLastTry) throw err;

      const backoffMs = REQUEST_DELAY_MS * attempt;
      console.warn(`   retry ${attempt}/${MAX_RETRIES - 1} after error: ${err.message}`);
      await sleep(backoffMs);
    }
  }

  throw new Error("Failed to classify question after retries");
}

async function runMigration() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing in environment variables");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  await connectDB();

  const banks = await QuestionBank.find();
  if (!banks.length) {
    console.log("No questionbank documents found.");
    return;
  }

  let modifiedDocs = 0;
  let processedQuestions = 0;
  let updatedQuestions = 0;
  let skippedQuestions = 0;
  let failedQuestions = 0;

  console.log(`Found ${banks.length} questionbank document(s).`);

  for (const bank of banks) {
    const courseCode = String(bank.courseCode || "").trim().toUpperCase() || "GENERAL";
    const questions = Array.isArray(bank.questions) ? bank.questions : [];

    if (!questions.length) {
      console.log(`- ${courseCode}: no questions, skipped.`);
      continue;
    }

    console.log(`- ${courseCode}: ${questions.length} question(s)`);
    let docChanged = false;

    for (let idx = 0; idx < questions.length; idx += 1) {
      const question = questions[idx];
      processedQuestions += 1;

      if (!question || isMissing(question.text)) {
        failedQuestions += 1;
        console.warn(`   [${courseCode} #${idx + 1}] missing question text, skipped.`);
        continue;
      }

      if (hasCompleteMetadata(question)) {
        skippedQuestions += 1;
        continue;
      }

      try {
        const classification = await classifyQuestion(openai, String(question.text));

        question.subject = courseCode;
        question.topic = classification.topic;
        question.subtopic = classification.subtopic;
        question.difficulty = classification.difficulty;

        updatedQuestions += 1;
        docChanged = true;

        console.log(
          `   [${courseCode} #${idx + 1}] updated -> ${classification.topic} / ${classification.subtopic} / ${classification.difficulty}`
        );
      } catch (err) {
        failedQuestions += 1;
        console.error(`   [${courseCode} #${idx + 1}] failed: ${err.message}`);
      }

      await sleep(REQUEST_DELAY_MS);
    }

    if (docChanged) {
      await bank.save();
      modifiedDocs += 1;
      console.log(`   saved ${courseCode}`);
    }
  }

  console.log("\nReclassification complete:");
  console.log(`- Documents modified: ${modifiedDocs}`);
  console.log(`- Questions processed: ${processedQuestions}`);
  console.log(`- Questions updated: ${updatedQuestions}`);
  console.log(`- Questions skipped (already classified): ${skippedQuestions}`);
  console.log(`- Questions failed: ${failedQuestions}`);
}

async function main() {
  try {
    await runMigration();
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
