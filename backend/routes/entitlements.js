const express = require("express");
const router = express.Router();

const authStudent = require("../middleware/authStudent");
const {
  unlockSemester,
  getMyEntitlements,
  consumeEntitlement
} = require("../controllers/entitlements.controller");

router.get("/me", authStudent, getMyEntitlements);
router.post("/unlock-semester", authStudent, unlockSemester);
router.post("/consume", authStudent, consumeEntitlement);

module.exports = router;
