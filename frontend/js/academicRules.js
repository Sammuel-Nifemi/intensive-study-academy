

// academicRules.js
// ----------------------------------------------------
// PURPOSE:
// Central registry for academic fee logic, templates,
// and special-case rules.
// ----------------------------------------------------

export const academicRules = {

  // ============================================
  // DOCUMENT TEMPLATES
  // ============================================
  document: {
    headerTemplate:
      "Fee analysis for {PROGRAM} : {LEVEL} Level ({SEMESTER})",

    footerDisclaimer: [
      "This fee analysis is generated for guidance purposes only.",
      "It is not an official NOUN document.",
      "Fees and course structures are subject to change."
    ],

    watermark: "UNOFFICIAL"
  },

  // ============================================
  // SEMESTER FEES (NOT COURSE-BASED)
  // ============================================
  semesterFees: {
    undergraduate: {
      100: 46500,
      200: 46500,
      300: 38000,
      400: 38000
    }
  },

  // ============================================
  // SPECIAL COURSES REGISTRY
  // (Injected by rule, not fetched normally)
  // ============================================
  specialCourses: {
    DES303: {
      code: "DES303",
      title: "Entrepreneurship Studies III",
      appliesTo: {
        level: 300,
        semester: "First"
      },
      unit: 0,
      hasExam: false,
      category: "service",
      note: "Compulsory service course with no exam and zero unit."
    }
  },

  // ============================================
  // ADVISORY & POLICY NOTES
  // (Displayed conditionally)
  // ============================================
  advisoryNotes: {
    undergraduate: {
      100: [
        "Direct Entry students may have additional fees.",
        "Confirm applicable charges based on admission type."
      ],

      300: [
        "DES303 is a compulsory service course.",
        "It carries no unit and no examination."
      ]
    }
  },

  // ============================================
  // LEVEL-SPECIFIC RULES
  // ============================================
  levelRules: {
    300: {
      injectSpecialCourses: ["DES303"]
    }
  }

};
