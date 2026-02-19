require("dotenv").config(); // ✅ MUST be first

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const path = require("path");
const { validateEmailConfig } = require("./utils/mailer");
const { startBirthdayCron } = require("./utils/birthdayCron");

const authRoutes = require("./routes/auth");
const resourceRoutes = require("./routes/resourceRoutes");
const studentRoutes = require("./routes/student");
const semesterRoutes = require("./routes/semester");
const materialRoutes = require("./routes/materials");
const webhookRoutes = require("./routes/webhook");
const pastQuestionRoutes = require("./routes/pastQuestions");
const announcementRoutes = require("./routes/announcement.routes");
const blogRoutes = require("./routes/blog.routes");
const galleryRoutes = require("./routes/gallery.routes");
const publicContentRoutes = require("./routes/publicContent.routes");
const mockExamRoutes = require("./routes/mockExams");
const studentAnnouncementRoutes = require("./routes/studentAnnouncement.routes");
const studentAuthRoutes = require("./routes/studentAuth");
const studentSelfRoutes = require("./routes/studentSelf");
const studyCenterRoutes = require("./routes/studyCenterRoutes");
const programRoutes = require("./routes/programRoutes");
const adminContentRoutes = require("./routes/adminContent");
const adminControlRoutes = require("./routes/adminControl");
const adminAcademicHubRoutes = require("./routes/adminAcademicHub");
const adminCoursesRoutes = require("./routes/adminCourses");
const programCoursesRoutes = require("./routes/programCourses");
const adminStaffRoutes = require("./routes/adminStaff");
const staffRoutes = require("./routes/staff");
const magicAuthRoutes = require("./routes/magicAuth");
const coursesRoutes = require("./routes/courses");
const studentCoursesRoutes = require("./routes/studentCourses");
const liveClassesRoutes = require("./routes/liveClasses");
const studentContentRoutes = require("./routes/studentContent");
const studentAcademicRoutes = require("./routes/studentAcademic");
const feeRoutes = require("./routes/fees");
const studentAcademicMeRoutes = require("./routes/studentAcademicMe");
const entitlementsRoutes = require("./routes/entitlements");
const curriculumCoursesRoutes = require("./routes/curriculumCourses");
const adminCbtRoutes = require("./routes/adminCbt");
const cbtRoutes = require("./routes/cbt");
const mockRoutes = require("./routes/mocks");
const notificationRoutes = require("./routes/notifications");
const assignmentRoutes = require("./routes/assignments");
const summaryRoutes = require("./routes/summaries");
const paymentsRoutes = require("./routes/payments");
const accessLogsRoutes = require("./routes/accessLogs");
const pdfExportRoutes = require("./routes/pdfExport");
const academicSupportRoutes = require("./routes/academicSupport");
const app = express();

// 🔗 Connect Database
connectDB();
validateEmailConfig({ envPath: path.join(__dirname, ".env") });
startBirthdayCron();

// 🌍 Global middleware (ORDER MATTERS)
// const cors = require("cors");

app.use(cors({
  origin: ["http://127.0.0.1:5502", "http://localhost:5502"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/frontend",
  express.static(path.join(__dirname, "..", "frontend"))
);

// 🧾 Request logger (debug-friendly)
app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl);
  next();
});

// 🔐 Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/resources", resourceRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api", studentAcademicMeRoutes);
app.use("/api/entitlements", entitlementsRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/past-questions", pastQuestionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/student", require("./routes/gpa.routes"));
app.use("/api/student", require("./routes/pdf.routes"));
app.use("/api/student", require("./routes/calendar.routes"));
app.use("/api/announcements", announcementRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api", publicContentRoutes);
app.use("/api/students", studentAnnouncementRoutes);
app.use("/api/students", studentAuthRoutes);
app.use("/api/students", studentAcademicRoutes);
app.use("/api/student", studentSelfRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/curriculum", curriculumCoursesRoutes);
app.use("/api", studyCenterRoutes);
app.use("/api/study-centers", require("./routes/studyCenters"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/admin/public", require("./routes/public"));
app.use("/api/admin", require("./routes/adminFaculty"));
app.use("/api/admin", programRoutes);
app.use("/api/admin", adminContentRoutes);
app.use("/api/admin", adminControlRoutes);
app.use("/api/admin", adminAcademicHubRoutes);
app.use("/api/admin", adminCbtRoutes);
app.use("/api/admin", adminCoursesRoutes);
app.use("/api/admin", programCoursesRoutes);
app.use("/api/admin", adminStaffRoutes);
app.use("/api/staff", staffRoutes);
app.use("/auth", magicAuthRoutes);
app.use("/courses", coursesRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/student", studentCoursesRoutes);
app.use("/api/student", studentCoursesRoutes);
app.use("/student", liveClassesRoutes);
app.use("/student", studentContentRoutes);
app.use("/api/mock-exams", mockExamRoutes);
app.use("/api/cbt", cbtRoutes);
app.use("/api/mocks", mockRoutes);
app.use("/api/mock", mockRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/summaries", summaryRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/access", accessLogsRoutes);
app.use("/api/pdf", pdfExportRoutes);
app.use("/api/academic-support", academicSupportRoutes);



// ❤️ Health check
app.get("/", (req, res) => {
  res.send("API running...");
});

// 🚀 Start server (LAST)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
