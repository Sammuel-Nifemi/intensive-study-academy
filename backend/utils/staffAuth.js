const crypto = require("crypto");

function randomDigits(length) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += Math.floor(Math.random() * 10);
  }
  return out;
}

function generateOtp() {
  return `${randomDigits(2)}ISA${randomDigits(2)}`;
}

function generateTempPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass;
}

function normalizeOtp(value) {
  return String(value || "").trim().toUpperCase();
}

module.exports = {
  generateOtp,
  generateTempPassword,
  normalizeOtp
};
