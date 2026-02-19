console.log("app.js loaded");

/* ======================================================
   DEV MODE BYPASS (REMOVE BEFORE PRODUCTION)
====================================================== */
if (window.location.hostname === "127.0.0.1") {
  sessionStorage.setItem("isLoggedIn", "true");
  sessionStorage.setItem("accountType", "applicant");
}

document.addEventListener("DOMContentLoaded", () => {

  /* ======================================================
     1. PAGE PROTECTION – START APPLICATION
  ====================================================== */
  if (window.location.pathname.includes("start-application")) {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const accountType = sessionStorage.getItem("accountType");

    if (isLoggedIn !== "true" || accountType !== "applicant") {
      window.location.href = "applicant-auth.html";
      return;
    }
  }

  /* ======================================================
     2. APPLY BUTTONS (UNDERGRADUATE & POSTGRADUATE)
  ====================================================== */
  const applyBtn = document.getElementById("applyBtn");
  const pgApplyBtn = document.getElementById("pgApplyBtn");

  function handleApply(programmeType) {
    sessionStorage.setItem("programmeType", programmeType);

    const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      window.location.href = "start-application.html";
    } else {
      window.location.href = "applicant-auth.html";
    }
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", () =>
      handleApply("undergraduate")
    );
  }

  if (pgApplyBtn) {
    pgApplyBtn.addEventListener("click", () =>
      handleApply("postgraduate")
    );
  }

  /* ======================================================
     3. APPLICANT REGISTER (ONLY ONE HANDLER)
  ====================================================== */
  const registerForm = document.getElementById("registerForm");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  const submitBtn = document.getElementById("submitBtn");

  /* SHOW / HIDE PASSWORD */
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.textContent = isPassword ? "🙈" : "👁️";
    });
  }

  /* REGISTER SUBMIT */
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

      if (!passwordRegex.test(passwordInput.value)) {
        alert(
          "Password must contain uppercase, lowercase, number, and special character."
        );
        return;
      }

      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("accountType", "applicant");

      submitBtn.textContent = "Please wait...";
      submitBtn.disabled = true;

      setTimeout(() => {
        window.location.href = "start-application.html";
      }, 1500);
    });
  }

  /* ======================================================
     4. NAME CONFIRMATION CHECKBOX
  ====================================================== */
  const admissionForm = document.querySelector(".admission-form");

  if (admissionForm) {
    admissionForm.addEventListener("submit", (e) => {
      const confirmBox = document.getElementById("nameConfirm");

      if (confirmBox && !confirmBox.checked) {
        e.preventDefault();
        alert(
          "Please confirm that your name matches your NIN and official documents."
        );
      }
    });
  }

  /* ======================================================
     5. STATE → LGA DATA
  ====================================================== */
  const stateLGA = {
    Lagos: ["Agege","Ikeja","Ikorodu","Epe","Badagry"],
    Oyo: ["Ibadan North","Ibadan South-West","Ogbomosho"],
    Ondo: ["Akure South","Owo","Ondo West"],
    "FCT Abuja": ["Abaji","Bwari","Gwagwalada","Kuje"]
  };

  const stateSelect = document.getElementById("state");
  const lgaSelect = document.getElementById("lga");

  if (stateSelect && lgaSelect) {
    stateSelect.addEventListener("change", () => {
      lgaSelect.innerHTML = `<option value="">Select LGA</option>`;
      (stateLGA[stateSelect.value] || []).forEach((lga) => {
        const option = document.createElement("option");
        option.value = lga;
        option.textContent = lga;
        lgaSelect.appendChild(option);
      });
    });
  }

});


/* ======================================================
   APPLICANT LOGIN (FIX)
====================================================== */
const applicantLogin = document.getElementById("applicantLogin");

if (applicantLogin) {
  applicantLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    console.log("LOGIN SUBMIT FIRED");

    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("accountType", "applicant");

    const btn = applicantLogin.querySelector("button");
    if (btn) {
      btn.textContent = "Logging in...";
      btn.disabled = true;
    }

    setTimeout(() => {
      window.location.href = "start-application.html";
    }, 1200);
  });
}

const PGD_COURSES = [
  "PGD Accounting",
  "PGD Banking and Finance",
  "PGD Business Administration",
  "PGD Public Administration",
  "PGD Computer Science",
  "PGD Information Technology",
  "PGD Economics",
  "PGD Mass Communication",
  "PGD Education",
  "PGD Human Resource Management",
  "PGD Entrepreneurship",
  "PGD Project Management"
];

const MSC_COURSES = [
  "MSc Accounting",
  "MSc Banking and Finance",
  "MSc Business Administration",
  "MSc Economics",
  "MSc Political Science",
  "MSc Public Administration",
  "MSc Mass Communication",
  "MSc Criminology and Security Studies",
  "MSc Computer Science",
  "MSc Information Technology",
  "MSc Data Management",
  "MSc Peace and Conflict Studies",
  "MSc Educational Administration",
  "MEd Educational Technology"
];

const PHD_COURSES = [
  "PhD Accounting",
  "PhD Business Administration",
  "PhD Economics",
  "PhD Political Science",
  "PhD Public Administration",
  "PhD Mass Communication",
  "PhD Criminology and Security Studies",
  "PhD Computer Science",
  "PhD Information Technology",
  "PhD Educational Administration",
  "PhD Peace and Conflict Studies"
];

