const mongoose = require("mongoose");
const crypto = require("crypto");

function normalizeTitle(title) {
  const value = String(title || "").trim().toLowerCase();
  if (value === "mr") return "Mr.";
  if (value === "miss" || value === "mrs" || value === "ms") return "Ms.";
  return "Mr.";
}

function pickInitial(fullName, email) {
  const fromName = String(fullName || "")
    .trim()
    .split(/\s+/)
    .find(Boolean);
  if (fromName) return fromName.charAt(0).toUpperCase();
  const fromEmail = String(email || "").trim();
  if (fromEmail) return fromEmail.charAt(0).toUpperCase();
  return "S";
}

async function generateIsaStudentId(Model) {
  for (let i = 0; i < 10; i += 1) {
    const digits = crypto.randomInt(0, 100000).toString().padStart(5, "0");
    const candidate = `ISA-${digits}`;
    const exists = await Model.exists({ isaStudentId: candidate });
    if (!exists) return candidate;
  }
  return `ISA-${Date.now().toString().slice(-5)}`;
}

async function generateReferralCode(Model) {
  for (let i = 0; i < 10; i += 1) {
    const candidate = `ISA-REF-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const exists = await Model.exists({ referralCode: candidate });
    if (!exists) return candidate;
  }
  return `ISA-REF-${Date.now().toString().slice(-8)}`;
}

const studentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
   email: {
  type: String,
  lowercase: true,
  trim: true
},

    faculty: {
      type: String,
      trim: true
    },
    facultyId: {
      type: String,
      trim: true
    },
    facultyName: {
      type: String,
      trim: true
    },
    program: {
      type: String,
      trim: true
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program"
    },
    programName: {
      type: String,
      trim: true
    },
    level: {
      type: String,
      trim: true
    },
    semester: {
      type: String,
      trim: true
    },
    study_center: {
      type: String,
      trim: true
    },
    studyCenter: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    lastLogin: {
      type: Date,
      default: null
    },
    loginCount: {
      type: Number,
      default: 0
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null
    },
    title: {
      type: String,
      enum: ["Mr", "Miss", "Mrs"]
    },
    birthday: {
      day: { type: Number },
      month: { type: Number }
    },
    registeredCourses: {
      type: [String],
      default: []
    },
    isaStudentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    studentAlias: {
      type: String,
      trim: true
    },
    courseSelectionLocked: {
      type: Boolean,
      default: false
    },
    semesterPaid: {
      type: Boolean,
      default: false
    },
    walletBalance: {
      type: Number,
      default: 0
    },
    walletCreditRefs: {
      type: [String],
      default: []
    },
    courseUsage: {
      mock: { type: Map, of: Number, default: {} },
      summary: { type: Map, of: Number, default: {} },
      pq: { type: Map, of: Number, default: {} }
    },
    profileComplete: {
      type: Boolean,
      default: false
    },
    profile_complete: {
      type: Boolean,
      default: false
    },
    profileCompleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

studentSchema.pre("validate", async function preValidateStudent() {
  if (!this.studyCenter && this.study_center) {
    this.studyCenter = String(this.study_center).trim();
  }
  if (!this.study_center && this.studyCenter) {
    this.study_center = String(this.studyCenter).trim();
  }

  if (!this.isaStudentId) {
    this.isaStudentId = await generateIsaStudentId(this.constructor);
  }
  if (!this.referralCode) {
    this.referralCode = await generateReferralCode(this.constructor);
  }

  const shouldRefreshAlias =
    !this.studentAlias || this.isNew || this.isModified("title");
  if (!shouldRefreshAlias) {
    return;
  }

  let fullName = "";
  if (this.user_id) {
    const UserModel = mongoose.models.User || mongoose.model("User");
    const user = await UserModel.findById(this.user_id).select("fullName").lean();
    fullName = user?.fullName || "";
  }

  const prefix = normalizeTitle(this.title);
  const initial = pickInitial(fullName, this.email);
  this.studentAlias = `${prefix} ${initial}`;
});

module.exports = mongoose.models.Student || mongoose.model("Student", studentSchema);
