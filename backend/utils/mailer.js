const fs = require("fs");
const sendgrid = require("@sendgrid/mail");

const isEmailEnabled = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const mailFrom = process.env.MAIL_FROM;
  return Boolean(apiKey && apiKey.startsWith("SG.") && mailFrom);
};

const validateEmailConfig = ({ envPath } = {}) => {
  if (envPath) {
    try {
      const raw = fs.readFileSync(envPath, "utf8");
      const mailFromMatches = raw.match(/^MAIL_FROM=/gm) || [];
      const mailFromNameMatches = raw.match(/^MAIL_FROM_NAME=/gm) || [];
      if (mailFromMatches.length > 1) {
        console.warn("[Mailer] Duplicate MAIL_FROM entries in .env. Using last value.");
      }
      if (mailFromNameMatches.length > 1) {
        console.warn("[Mailer] Duplicate MAIL_FROM_NAME entries in .env. Using last value.");
      }
    } catch {
      // Ignore env file read errors to avoid breaking startup.
    }
  }

  if (!isEmailEnabled()) {
    console.warn("SendGrid misconfigured — email disabled.");
  }
};

async function sendMail({ to, subject, text }) {
  if (!isEmailEnabled()) {
    console.warn("[Mailer] Email disabled. Skipping send:", { to, subject });
    return { sent: false, disabled: true };
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  sendgrid.setApiKey(apiKey);
  const fromEmail = process.env.MAIL_FROM || "admin@intensivestudyacademy.com";
  const fromName = process.env.MAIL_FROM_NAME || "Intensive Study Academy";

  try {
    await sendgrid.send({
      to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject,
      text
    });
    return { sent: true };
  } catch (error) {
    console.error("SendGrid Error:", error.response?.body || error.message);
    return { sent: false, error: error.response?.body || error.message };
  }
}

module.exports = { sendMail, isEmailEnabled, validateEmailConfig };
