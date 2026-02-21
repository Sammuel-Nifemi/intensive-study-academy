const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/requireAdmin");
const requireAdminOrStaff = require("../middleware/requireAdminOrStaff");
const createPdfUploader = require("../utils/uploadPdf");

const CourseMaterial = require("../models/CourseMaterial");
const MockExam = require("../models/MockExam");
const ExamTimetable = require("../models/ExamTimetable");
const FeeStructure = require("../models/FeeStructure");

const uploadMaterials = createPdfUploader("academic/materials");
const uploadMocks = createPdfUploader("academic/mocks");
const uploadTimetables = createPdfUploader("academic/timetables");

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

function buildFilter(query) {
  const filter = {};
  ["faculty", "program", "level", "semester"].forEach((key) => {
    if (query[key]) filter[key] = query[key];
  });
  return filter;
}

function parseOtherFees(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

/* =========================
   COURSE MATERIALS
========================= */
router.get("/course-materials", requireAdminOrStaff, async (req, res) => {
  try {
    const items = await CourseMaterial.find(buildFilter(req.query))
      .populate("program", "name")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch course materials" });
  }
});

router.post(
  "/course-materials",
  requireAdminOrStaff,
  uploadMaterials.array("files"),
  async (req, res) => {
    try {
      const error = requireAcademicFields(req.body);
      if (error) return res.status(400).json({ message: error });
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "File upload failed" });
      }

      const { title, description, faculty, program, level, semester, courseCode, materialType } = req.body;

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
            filePath: file.path,
            materialType: materialType || "lecture",
            uploadedBy: req.user.id
          })
        )
      );

      res.status(201).json({ message: "Materials uploaded", items });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.get("/course-materials/:id", requireAdminOrStaff, async (req, res) => {
  try {
    const item = await CourseMaterial.findById(req.params.id).populate("program", "name");
    if (!item) return res.status(404).json({ message: "Material not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch material" });
  }
});

router.put(
  "/course-materials/:id",
  requireAdminOrStaff,
  uploadMaterials.single("file"),
  async (req, res) => {
    try {
      const updates = { ...req.body };
      if (req.file) {
        updates.fileUrl = normalizePath(req.file.path);
        updates.filePath = req.file.path;
      }
      const item = await CourseMaterial.findByIdAndUpdate(req.params.id, updates, {
        new: true
      });
      if (!item) return res.status(404).json({ message: "Material not found" });
      res.json({ message: "Material updated", item });
    } catch (err) {
      res.status(500).json({ message: "Failed to update material" });
    }
  }
);

router.delete("/course-materials/:id", requireAdmin, async (req, res) => {
  try {
    await CourseMaterial.findByIdAndDelete(req.params.id);
    res.json({ message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete material" });
  }
});

/* =========================
   MOCK EXAMS
========================= */
router.get("/mocks", requireAdminOrStaff, async (req, res) => {
  try {
    const items = await MockExam.find(buildFilter(req.query))
      .populate("program", "name")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch mock exams" });
  }
});

router.post("/mocks", requireAdminOrStaff, uploadMocks.array("files"), async (req, res) => {
  try {
    const error = requireAcademicFields(req.body);
    if (error) return res.status(400).json({ message: error });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "File upload failed" });
    }

    const { title, faculty, program, level, semester, courseCode } = req.body;
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
          uploadedBy: req.user.id
        })
      )
    );
    res.status(201).json({ message: "Mock exams uploaded", items });
  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
});

router.get("/mocks/:id", requireAdminOrStaff, async (req, res) => {
  try {
    const item = await MockExam.findById(req.params.id).populate("program", "name");
    if (!item) return res.status(404).json({ message: "Mock exam not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch mock exam" });
  }
});

router.put("/mocks/:id", requireAdminOrStaff, uploadMocks.single("file"), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.fileUrl = normalizePath(req.file.path);
    }
    const item = await MockExam.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!item) return res.status(404).json({ message: "Mock exam not found" });
    res.json({ message: "Mock exam updated", item });
  } catch (err) {
    res.status(500).json({ message: "Failed to update mock exam" });
  }
});

router.delete("/mocks/:id", requireAdmin, async (req, res) => {
  try {
    await MockExam.findByIdAndDelete(req.params.id);
    res.json({ message: "Mock exam deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete mock exam" });
  }
});

/* =========================
   EXAM TIMETABLES
========================= */
router.get("/exam-timetables", requireAdminOrStaff, async (req, res) => {
  try {
    const items = await ExamTimetable.find(buildFilter(req.query))
      .populate("program", "name")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch exam timetables" });
  }
});

router.post(
  "/exam-timetables",
  requireAdminOrStaff,
  uploadTimetables.array("files"),
  async (req, res) => {
    try {
      const error = requireAcademicFields(req.body);
      if (error) return res.status(400).json({ message: error });
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "File upload failed" });
      }

      const { title, faculty, program, level, semester, courseCode } = req.body;
      const items = await Promise.all(
        req.files.map((file) =>
          ExamTimetable.create({
            title: title || file.originalname,
            faculty,
            program,
            level,
            semester,
            courseCode,
            fileUrl: normalizePath(file.path),
            uploadedBy: req.user.id
          })
        )
      );
      res.status(201).json({ message: "Exam timetables uploaded", items });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.get("/exam-timetables/:id", requireAdminOrStaff, async (req, res) => {
  try {
    const item = await ExamTimetable.findById(req.params.id).populate("program", "name");
    if (!item) return res.status(404).json({ message: "Exam timetable not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch exam timetable" });
  }
});

router.put(
  "/exam-timetables/:id",
  requireAdminOrStaff,
  uploadTimetables.single("file"),
  async (req, res) => {
    try {
      const updates = { ...req.body };
      if (req.file) {
        updates.fileUrl = normalizePath(req.file.path);
      }
      const item = await ExamTimetable.findByIdAndUpdate(req.params.id, updates, {
        new: true
      });
      if (!item) return res.status(404).json({ message: "Exam timetable not found" });
      res.json({ message: "Exam timetable updated", item });
    } catch (err) {
      res.status(500).json({ message: "Failed to update exam timetable" });
    }
  }
);

router.delete("/exam-timetables/:id", requireAdmin, async (req, res) => {
  try {
    await ExamTimetable.findByIdAndDelete(req.params.id);
    res.json({ message: "Exam timetable deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete exam timetable" });
  }
});

/* =========================
   FEE STRUCTURES
========================= */
router.get("/fee-structures", requireAdminOrStaff, async (req, res) => {
  try {
    const items = await FeeStructure.find(buildFilter(req.query))
      .populate("program", "name")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fee structures" });
  }
});

router.post("/fee-structures", requireAdminOrStaff, async (req, res) => {
  try {
    const error = requireAcademicFields(req.body);
    if (error) return res.status(400).json({ message: error });

    const { faculty, program, level, semester, perCourseFee, perExamFee, otherFees } =
      req.body;

    const item = await FeeStructure.create({
      faculty,
      program,
      level,
      semester,
      perCourseFee,
      perExamFee,
      otherFees: parseOtherFees(otherFees)
    });

    res.status(201).json({ message: "Fee structure created", item });
  } catch (err) {
    res.status(500).json({ message: "Failed to create fee structure" });
  }
});

router.get("/fee-structures/:id", requireAdminOrStaff, async (req, res) => {
  try {
    const item = await FeeStructure.findById(req.params.id).populate("program", "name");
    if (!item) return res.status(404).json({ message: "Fee structure not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fee structure" });
  }
});

router.put("/fee-structures/:id", requireAdminOrStaff, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.otherFees) {
      updates.otherFees = parseOtherFees(updates.otherFees);
    }

    const item = await FeeStructure.findByIdAndUpdate(req.params.id, updates, {
      new: true
    });
    if (!item) return res.status(404).json({ message: "Fee structure not found" });
    res.json({ message: "Fee structure updated", item });
  } catch (err) {
    res.status(500).json({ message: "Failed to update fee structure" });
  }
});

router.delete("/fee-structures/:id", requireAdmin, async (req, res) => {
  try {
    await FeeStructure.findByIdAndDelete(req.params.id);
    res.json({ message: "Fee structure deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete fee structure" });
  }
});

module.exports = router;
