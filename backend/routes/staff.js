const express = require("express");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const bcrypt = require("bcrypt");
const router = express.Router();

const authStaff = require("../middleware/authStaff");
const requireStaff = require("../middleware/requireStaff");
const createPdfUploader = require("../utils/uploadPdf");
const { notifyUsers } = require("../utils/notifyUsers");

const CourseMaterial = require("../models/CourseMaterial");
const MockExam = require("../models/MockExam");
const CBTQuestion = require("../models/CBTQuestion");
const CBTExam = require("../models/CBTExam");
const Staff = require("../models/Staff");
const Announcement = require("../models/Announcement");
const User = require("../models/User");

const uploadMaterials = createPdfUploader("academic/materials");
const uploadMocks = createPdfUploader("academic/mocks");
const uploadCbt = createPdfUploader("cbt");
const uploadAnnouncements = createPdfUploader("announcements");

function normalizeCourseCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizePath(p) {
  return p ? `/${p.replace(/\\/g, "/")}` : null;
}

function requireAcademicFields(body) {
  const { faculty, program, level, semester } = body;
  if (!faculty || !program || !level || !semester) {
    return "faculty, program, level, and semester are required";
  }
  return null;
}

function isProfileComplete(staff) {
  return Boolean(
    staff.fullName &&
      staff.title &&
      staff.staffRole &&
      staff.dobDay &&
      staff.dobMonth
  );
}

function profileRequiredMessage() {
  return "Complete your profile before uploading.";
}

function parseQuestions(rawText) {
  const text = String(rawText || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  if (!text) return [];

  const matches = [...text.matchAll(/(^|\n)\s*(\d+)\s*[).]\s+/g)];
  if (matches.length === 0) {
    return [];
  }

  const blocks = matches.map((match, idx) => {
    const start = match.index + match[0].length;
    const end = idx + 1 < matches.length ? matches[idx + 1].index : text.length;
    return text.slice(start, end).trim();
  });

  return blocks
    .map((block, idx) => {
      if (!block) return null;

      let answer = "";
      const answerMatch = block.match(/Answer\s*:\s*(.+)$/im);
      if (answerMatch) {
        answer = answerMatch[1].trim();
        block = block.replace(answerMatch[0], "").trim();
      }

      const optionMatches = [...block.matchAll(/(^|\n)\s*([A-D])[\).]\s+(.+)/g)];
      let options = [];
      if (optionMatches.length >= 2) {
        options = optionMatches.map((m) => m[3].trim());
      }

      let questionText = block;
      if (optionMatches.length) {
        const firstOptIndex = optionMatches[0].index ?? block.length;
        questionText = block.slice(0, firstOptIndex).trim();
      }

      const questionType = options.length >= 2 ? "mcq" : "fill";

      let correctAnswer = answer;
      if (questionType === "mcq") {
        const letterMatch = answer.match(/^[A-D]$/i);
        if (letterMatch) {
          correctAnswer = letterMatch[0].toUpperCase();
        } else if (answer) {
          const optionIndex = options.findIndex(
            (opt) => opt.toLowerCase() === answer.toLowerCase()
          );
          if (optionIndex >= 0) {
            correctAnswer = String.fromCharCode(65 + optionIndex);
          }
        }
      }

      return {
        questionText: questionText || `Question ${idx + 1}`,
        questionType,
        options,
        correctAnswer,
        order: idx + 1
      };
    })
    .filter(Boolean);
}

// Profile data
router.get("/me", authStaff, requireStaff(), async (req, res) => {
  res.json({
    success: true,
    data: {
      fullName: req.staff.fullName || "",
      title: req.staff.title || "",
      role: req.staff.staffRole || "",
      dobDay: req.staff.dobDay || null,
      dobMonth: req.staff.dobMonth || null,
      avatarUrl: req.staff.avatarUrl || ""
    }
  });
});

// Profile update
router.put("/me", authStaff, requireStaff(), async (req, res) => {
  try {
    const { fullName, title, role, dobDay, dobMonth, avatarUrl } = req.body;

    if (!fullName || !title || !role || !dobDay || !dobMonth) {
      return res.status(400).json({ message: "All profile fields are required." });
    }

    const day = Number(dobDay);
    const month = Number(dobMonth);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return res.status(400).json({ message: "Invalid birth day." });
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid birth month." });
    }

    req.staff.fullName = String(fullName).trim();
    req.staff.title = String(title).trim();
    req.staff.staffRole = String(role).trim();
    req.staff.dobDay = day;
    req.staff.dobMonth = month;
    req.staff.avatarUrl = avatarUrl ? String(avatarUrl).trim() : undefined;

    await req.staff.save();

    res.json({
      success: true,
      data: {
        fullName: req.staff.fullName,
        title: req.staff.title,
        role: req.staff.staffRole,
        dobDay: req.staff.dobDay,
        dobMonth: req.staff.dobMonth,
        avatarUrl: req.staff.avatarUrl || ""
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to save profile" });
  }
});

// Dashboard summary (view-only)
router.get("/dashboard", authStaff, requireStaff(), async (req, res) => {
  try {
    const [materialsCount, mocksCount, cbtCount] = await Promise.all([
      CourseMaterial.countDocuments({ uploadedBy: req.user.id }),
      MockExam.countDocuments({ uploadedBy: req.user.id }),
      CBTExam.countDocuments({ uploadedBy: req.user.id })
    ]);

    res.json({
      fullName: req.staff.fullName,
      title: req.staff.title,
      role: req.staff.staffRole,
      stats: {
        materialsUploaded: materialsCount,
        mocksUploaded: mocksCount,
        cbtUploaded: cbtCount
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

// Settings (preferences only)
// Settings (preferences only).
router.get("/settings", authStaff, requireStaff(), async (req, res) => {
  res.json({
    emailNotifications: req.staff.emailNotifications,
    inAppNotifications: req.staff.inAppNotifications,
    darkMode: req.staff.darkMode
  });
});

router.post("/settings", authStaff, requireStaff(), async (req, res) => {
  try {
    const { emailNotifications, inAppNotifications, darkMode } = req.body;

    if (emailNotifications !== undefined) req.staff.emailNotifications = Boolean(emailNotifications);
    if (inAppNotifications !== undefined) req.staff.inAppNotifications = Boolean(inAppNotifications);
    if (darkMode !== undefined) req.staff.darkMode = Boolean(darkMode);

    await req.staff.save();

    res.json({ message: "Settings updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings" });
  }
});

router.post("/change-password", authStaff, requireStaff(), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const isMatch = await bcrypt.compare(currentPassword, req.staff.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    req.staff.password = await bcrypt.hash(newPassword, 10);
    await req.staff.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update password" });
  }
});

router.post("/deactivate-request", authStaff, requireStaff(), async (req, res) => {
  try {
    req.staff.deactivationRequested = true;
    await req.staff.save();
    res.json({ message: "Deactivation request submitted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit request" });
  }
});

router.post(
  "/materials",
  authStaff,
  requireStaff("materials"),
  uploadMaterials.array("files"),
  async (req, res) => {
    try {
      if (!isProfileComplete(req.staff)) {
        return res.status(400).json({ message: profileRequiredMessage() });
      }
      const error = requireAcademicFields(req.body);
      if (error) return res.status(400).json({ message: error });
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "File upload failed" });
      }

      const { title, description, faculty, program, level, semester, courseCode, materialType } = req.body;
      const filePaths = req.files.map((file) => normalizePath(file.path)).filter(Boolean);

      const items = await Promise.all(
        req.files.map((file) =>
          CourseMaterial.create({
            title: title || file.originalname,
            description,
            faculty,
            program,
            level,
            semester,
            courseCode,
            fileUrl: normalizePath(file.path),
            materialType: materialType || "lecture",
            files: filePaths,
            staffId: req.user.id,
            uploadedBy: req.user.id
          })
        )
      );

      const staffName = req.staff?.fullName || req.staff?.email || "Staff";
      const studentUsers = await User.find({ role: "student" }).select("_id role").lean();
      await notifyUsers(
        studentUsers.map((u) => ({ id: u._id, role: u.role })),
        "material",
        "New Materials uploaded",
        `${items[0]?.title || "New materials"} by ${staffName}`,
        { materialIds: items.map((item) => item._id) }
      );

      res.status(201).json({ message: "Materials uploaded", items });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.post(
  "/mocks",
  authStaff,
  requireStaff("mocks"),
  uploadMocks.array("files"),
  async (req, res) => {
    try {
      if (!isProfileComplete(req.staff)) {
        return res.status(400).json({ message: profileRequiredMessage() });
      }
      const error = requireAcademicFields(req.body);
      if (error) return res.status(400).json({ message: error });
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "File upload failed" });
      }

      const { title, faculty, program, level, semester, courseCode, description } = req.body;
      const filePaths = req.files.map((file) => normalizePath(file.path)).filter(Boolean);
      const items = await Promise.all(
        req.files.map((file) =>
          MockExam.create({
            title: title || file.originalname,
            faculty,
            program,
            level,
            semester,
            courseCode,
            fileUrl: normalizePath(file.path),
            files: filePaths,
            description,
            staffId: req.user.id,
            uploadedBy: req.user.id
          })
        )
      );
      res.status(201).json({ message: "Mock exams uploaded", items });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.post(
  "/cbt/convert",
  authStaff,
  requireStaff("cbt"),
  uploadCbt.single("file"),
  async (req, res) => {
    try {
      if (!isProfileComplete(req.staff)) {
        return res.status(400).json({ message: profileRequiredMessage() });
      }
      const courseCode = normalizeCourseCode(req.body.courseCode);
      if (!courseCode) {
        return res.status(400).json({ message: "courseCode is required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "PDF file is required" });
      }
      const ext = req.file.originalname?.toLowerCase().split(".").pop();
      if (ext && ext !== "pdf") {
        return res.status(400).json({ message: "PDF file is required for CBT conversion" });
      }

      const pdfBuffer = fs.readFileSync(req.file.path);
      const parsed = await pdfParse(pdfBuffer);
      const questions = parseQuestions(parsed.text);

      if (!questions.length) {
        return res.status(400).json({ message: "No questions detected in PDF" });
      }

      await CBTQuestion.deleteMany({ courseCode });
      const docs = questions.map((q) => ({
        courseCode,
        ...q
      }));
      await CBTQuestion.insertMany(docs);

      const durationMinutes = Number(req.body.durationMinutes) || 50;
      const totalQuestions = questions.length;

      await CBTExam.findOneAndUpdate(
        { courseCode },
        {
          courseCode,
          durationMinutes,
          totalQuestions,
          isActive: true,
          uploadedBy: req.user.id,
          staffId: req.user.id,
          title: req.body.title,
          faculty: req.body.faculty,
          program: req.body.program,
          level: req.body.level,
          semester: req.body.semester,
          description: req.body.description,
          files: [normalizePath(req.file.path)].filter(Boolean)
        },
        { new: true, upsert: true }
      );

      res.status(201).json({
        courseCode,
        totalQuestions,
        durationMinutes
      });
    } catch (err) {
      console.error("CBT convert error:", err);
      res.status(500).json({ message: "Failed to convert CBT exam" });
    }
  }
);

// Upload history
router.get("/uploads", authStaff, requireStaff(), async (req, res) => {
  try {
    const staffId = req.user.id;
    const [materials, mocks, cbtExams] = await Promise.all([
      CourseMaterial.find({ uploadedBy: staffId }).select("title createdAt").lean(),
      MockExam.find({ uploadedBy: staffId }).select("title createdAt").lean(),
      CBTExam.find({ uploadedBy: staffId }).select("courseCode createdAt").lean()
    ]);

    const history = [
      ...materials.map((item) => ({
        id: item._id,
        type: "materials",
        title: item.title,
        createdAt: item.createdAt
      })),
      ...mocks.map((item) => ({
        id: item._id,
        type: "mock",
        title: item.title,
        createdAt: item.createdAt
      })),
      ...cbtExams.map((item) => ({
        id: item._id,
        type: "cbt",
        title: item.courseCode,
        createdAt: item.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ message: "Failed to load uploads" });
  }
});

// Staff announcements
router.post(
  "/announcements",
  authStaff,
  requireStaff(),
  uploadAnnouncements.array("files"),
  async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const attachments = (req.files || [])
      .map((file) => normalizePath(file.path))
      .filter(Boolean);

    const announcement = await Announcement.create({
      staffId: req.user.id,
      title: String(title).trim(),
      body: String(body).trim(),
      message: String(body).trim(),
      attachments
    });

    const studentUsers = await User.find({ role: "student" }).select("_id role").lean();
    await notifyUsers(
      studentUsers.map((u) => ({ id: u._id, role: u.role })),
      "announcement",
      announcement.title,
      announcement.body,
      { announcementId: announcement._id }
    );

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create announcement" });
  }
});

router.get("/announcements", authStaff, requireStaff(), async (req, res) => {
  try {
    const announcements = await Announcement.find({ staffId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ message: "Failed to load announcements" });
  }
});

module.exports = router;
