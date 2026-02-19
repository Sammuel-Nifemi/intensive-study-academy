require("dotenv").config();
const mongoose = require("mongoose");
const StudyCenter = require("../models/StudyCenter");

const studyCenters = [
  { state: "Abuja", name: "Abuja Garki Study Centre" },
  { state: "Abuja", name: "Abuja Wuse II Study Centre" },
  { state: "Abia", name: "Abia Umudike Study Centre" },
  { state: "Ebonyi", name: "Ebonyi Abakaliki Study Centre" },
  { state: "Kano", name: "Kano Gwarzo Study Centre" },
  { state: "Kano", name: "Kano Fagge Study Centre" },
  { state: "Lagos", name: "Lagos Ikeja Study Centre" }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await StudyCenter.deleteMany(); // reset
    await StudyCenter.insertMany(studyCenters);

    console.log("✅ Study centers seeded successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
})();
