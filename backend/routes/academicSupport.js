const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const {
  getWeakAreas,
  getStudyTip,
  askAcademicSupport,
  explainQuestion,
  explainCourse,
  getAdvisorObservation,
  getAdvisorFeedbackForAttempt,
  exportAiResponseAsPdf
} = require("../controllers/academicSupport.controller");

router.get("/weak-areas", authStudent, getWeakAreas);
router.get("/study-tip", authStudent, getStudyTip);
router.get("/advisor-observation", authStudent, getAdvisorObservation);
router.get("/advisor-feedback/:attemptId", authStudent, getAdvisorFeedbackForAttempt);
router.post("/ask", authStudent, askAcademicSupport);
router.post("/explain-course", authStudent, explainCourse);
router.post("/explain-question", authStudent, explainQuestion);
router.post("/export-pdf", authStudent, exportAiResponseAsPdf);

module.exports = router;
