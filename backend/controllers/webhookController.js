const crypto = require("crypto");
const Student = require("../models/Student");
const Payment = require("../models/Payment");

function getSignature(req) {
  return String(req.headers["x-paystack-signature"] || "").trim();
}

function verifyPaystackSignature(req, secretKey) {
  const signature = getSignature(req);
  if (!signature || !secretKey || !Buffer.isBuffer(req.body)) return false;

  const expected = crypto
    .createHmac("sha512", secretKey)
    .update(req.body)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== signatureBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

function parseWebhookEvent(req) {
  if (!Buffer.isBuffer(req.body)) return null;
  try {
    return JSON.parse(req.body.toString("utf8"));
  } catch (err) {
    return null;
  }
}

exports.paystackWebhook = async (req, res) => {
  const secret = String(process.env.PAYSTACK_SECRET_KEY || "").trim();

  try {
    // Paystack expects 200 responses; never leak internal errors here.
    if (!verifyPaystackSignature(req, secret)) {
      return res.sendStatus(200);
    }

    const event = parseWebhookEvent(req);
    if (!event || event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = event.data || {};
    const reference = String(data.reference || "").trim();
    const customerEmail = String(data.customer?.email || "")
      .trim()
      .toLowerCase();
    const amountKobo = Number(data.amount || 0);
    const amountNaira = Number.isFinite(amountKobo) ? amountKobo / 100 : 0;

    if (!reference || !customerEmail || amountNaira <= 0) {
      return res.sendStatus(200);
    }

    const student = await Student.findOne({ email: customerEmail }).select(
      "_id user_id walletCreditRefs"
    );
    if (!student) {
      return res.sendStatus(200);
    }

    // Idempotent payment log by unique reference.
    await Payment.updateOne(
      { reference },
      {
        $setOnInsert: {
          student: student.user_id || student._id,
          reference,
          amount: amountNaira,
          status: "success",
          gateway: "paystack"
        }
      },
      { upsert: true }
    );

    // Idempotent wallet credit: reference can only be applied once.
    await Student.updateOne(
      { _id: student._id, walletCreditRefs: { $ne: reference } },
      {
        $inc: { walletBalance: amountNaira },
        $addToSet: { walletCreditRefs: reference },
        $set: { semesterPaid: true }
      }
    );

    return res.sendStatus(200);
  } catch (err) {
    console.error("Paystack webhook processing error:", err);
    return res.sendStatus(200);
  }
};
