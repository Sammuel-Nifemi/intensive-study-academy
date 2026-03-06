require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const QuestionBank = require("../models/QuestionBank");

function isMissing(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

async function migrateQuestionMetadata() {
  let modifiedDocs = 0;

  await connectDB();

  const banks = await QuestionBank.find();
  if (!banks.length) {
    console.log("No questionbank documents found.");
    return;
  }

  for (const bank of banks) {
    const courseCode = String(bank.courseCode || "").trim().toUpperCase();
    const questions = Array.isArray(bank.questions) ? bank.questions : [];

    let docChanged = false;
    for (const question of questions) {
      if (!question || !isMissing(question.subject)) continue;

      question.subject = courseCode || "GENERAL";
      question.topic = "General";
      question.subtopic = "General";
      question.difficulty = "medium";
      docChanged = true;
    }

    if (docChanged) {
      await bank.save();
      modifiedDocs += 1;
    }
  }

  console.log(`Migration complete. Modified ${modifiedDocs} questionbank document(s).`);
}

async function run() {
  try {
    await migrateQuestionMetadata();
  } catch (err) {
    console.error("Question metadata migration failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
