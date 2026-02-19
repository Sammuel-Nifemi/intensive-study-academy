const mongoose = require("mongoose");

const getMongoDiagnostics = (mongoUri) => {
  try {
    const parsed = new URL(mongoUri);
    return {
      host: parsed.host || "unknown",
      db: parsed.pathname ? parsed.pathname.replace("/", "") : "unknown",
      user: parsed.username || "unknown",
      hasPassword: Boolean(parsed.password),
      options: parsed.search || "(none)",
    };
  } catch {
    return { parseError: "Invalid MONGO_URI format" };
  }
};

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    const diagnostics = getMongoDiagnostics(process.env.MONGO_URI);
    console.log("MongoDB target:", diagnostics);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected:", conn.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    process.exit(1); // stop the app cleanly
  }
};

module.exports = connectDB;
