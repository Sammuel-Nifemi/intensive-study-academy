const crypto = require("crypto");
const Student = require("../models/Student");
const Payment = require("../models/Payment");

exports.paystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const { reference, amount, customer } = event.data;

    const user = await User.findOne({ email: customer.email });

    if (!user) return res.sendStatus(200);

    // prevent duplicate records
    const exists = await Payment.findOne({ reference });
    if (exists) return res.sendStatus(200);

    await Payment.create({
      student: user._id,
      reference,
      amount: amount / 100,
      status: "success"
    });

    // unlock access
    user.student.semesterPaid = true;

    await user.save();
  }

  res.sendStatus(200);
};
