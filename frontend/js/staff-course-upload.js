

/* =====================================================
   STAFF COURSE & FEE UPLOAD
   -----------------------------------------------------
   - Reads JSON uploads
   - Validates against locked schema
   - Submits to pending approval queue
   - DOES NOT publish directly
   ===================================================== */

const form = document.getElementById("courseUploadForm");
const fileInput = document.getElementById("courseJsonFile");

/* ===============================
   UTILITIES
================================ */
function showError(message) {
  alert("❌ Upload Error:\n" + message);
}

function showSuccess(message) {
  alert("✅ Success:\n" + message);
}

/* ===============================
   SCHEMA VALIDATION
================================ */
function validateCourseSchema(data) {
  // Top-level checks
  if (!data.program || typeof data.program !== "string") {
    return "Missing or invalid 'program'";
  }

  if (![100, 200, 300, 400].includes(data.level)) {
    return "Invalid 'level' (must be 100, 200, 300, or 400)";
  }

  if (
    data.semester !== "First Semester" &&
    data.semester !== "Second Semester"
  ) {
    return "Invalid 'semester'";
  }

  if (!Array.isArray(data.courses) || data.courses.length === 0) {
    return "'courses' must be a non-empty array";
  }

  // Course-level checks
  for (let i = 0; i < data.courses.length; i++) {
    const c = data.courses[i];

    if (!c.code || typeof c.code !== "string") {
      return `Course ${i + 1}: missing or invalid 'code'`;
    }

    if (!c.title || typeof c.title !== "string") {
      return `Course ${i + 1}: missing or invalid 'title'`;
    }

    if (typeof c.unit !== "number") {
      return `Course ${i + 1}: 'unit' must be a number`;
    }

    if (c.status !== "C" && c.status !== "E") {
      return `Course ${i + 1}: 'status' must be 'C' or 'E'`;
    }

    if (typeof c.courseFee !== "number") {
      return `Course ${i + 1}: 'courseFee' must be a number`;
    }

    if (typeof c.examFee !== "number") {
      return `Course ${i + 1}: 'examFee' must be a number`;
    }

    if (
      c.materialUrl &&
      typeof c.materialUrl !== "string"
    ) {
      return `Course ${i + 1}: 'materialUrl' must be a string if provided`;
    }
  }

  return null; // ✅ valid
}

/* ===============================
   SUBMIT HANDLER
================================ */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    showError("No file selected");
    return;
  }

  if (!file.name.endsWith(".json")) {
    showError("Only JSON files are allowed");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    let parsed;

    try {
      parsed = JSON.parse(reader.result);
    } catch (err) {
      showError("Invalid JSON format");
      return;
    }

    const validationError = validateCourseSchema(parsed);
    if (validationError) {
      showError(validationError);
      return;
    }

    // ===============================
    // SAVE TO PENDING QUEUE
    // ===============================
    const pending =
      JSON.parse(localStorage.getItem("pendingCourseUploads")) || [];

    pending.push({
      id: Date.now(),
      submittedBy: localStorage.getItem("userEmail") || "staff",
      date: new Date().toISOString(),
      type: "course-data",
      payload: parsed,
      status: "pending"
    });

    localStorage.setItem(
      "pendingCourseUploads",
      JSON.stringify(pending)
    );

    showSuccess(
      "Course & fee data submitted successfully.\nAwaiting admin approval."
    );

    form.reset();
  };

  reader.readAsText(file);
});

form.querySelector("button[type='submit']").disabled = true;
form.innerHTML = `
  <div class="submission-lock">
    ✅ Course & fee data submitted.<br>
    Awaiting admin approval.
  </div>
`;
