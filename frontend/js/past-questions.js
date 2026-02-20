const token = localStorage.getItem("studentToken");

if (!token) {
  window.location.href = "/frontend/pages/student-login.html";
}

const API_BASE = (window.ISA_API_ORIGIN || "") + "";
let studentProfile = null;
let registeredCourses = new Set();
let searchTimeout = null;

const courseInput = document.getElementById("courseInput");
const resultsEl = document.getElementById("pqResults");

function normalizeCourseCode(value) {
  return value.replace(/\s+/g, "").toUpperCase();
}

async function loadStudentProfile() {
  if (studentProfile) return studentProfile;
  try {
    const cached = window.readStudentCache ? window.readStudentCache() : null;
    const data = cached || (window.loadStudent ? await window.loadStudent({ force: !cached }) : null);
    if (data) {
      studentProfile = data;
      const list = Array.isArray(data.registeredCourses) ? data.registeredCourses : [];
      registeredCourses = new Set(list.map((c) => String(c).toUpperCase()));
      return studentProfile;
    }
  } catch (err) {
    console.error("Failed to load student profile:", err);
  }
  return null;
}

function isCourseRegistered(courseCode) {
  if (!courseCode) return false;
  const normalized = String(courseCode).toUpperCase();
  return registeredCourses.has(normalized);
}

function ensureEntitlementModal() {
  let modal = document.getElementById("entitlementModal");
  if (modal) return modal;

  if (!document.getElementById("entitlementModalStyles")) {
    document.head.insertAdjacentHTML(
      "beforeend",
      `
      <style id="entitlementModalStyles">
        .entitlement-modal {
          position: fixed;
          inset: 0;
          background: rgba(9, 11, 16, 0.55);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .entitlement-modal .modal-box {
          width: min(420px, 92vw);
          background: #fff;
          border-radius: 14px;
          padding: 20px 22px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          text-align: center;
        }
        .entitlement-modal .modal-box h3 {
          margin: 0 0 8px;
          font-size: 1.2rem;
        }
        .entitlement-modal .modal-box p {
          margin: 8px 0;
          color: #2d2d2d;
        }
        .entitlement-modal .entitlement-status {
          font-weight: 600;
          color: #0b5ed7;
          min-height: 20px;
        }
        .entitlement-modal .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 16px;
        }
        .entitlement-modal .modal-actions button {
          border: 0;
          border-radius: 8px;
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 600;
        }
        .entitlement-modal .btn-primary {
          background: #0b5ed7;
          color: #fff;
        }
        .entitlement-modal .btn-secondary {
          background: #f0f2f5;
          color: #222;
        }
      </style>
      `
    );
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="entitlementModal" class="entitlement-modal" role="dialog" aria-modal="true">
      <div class="modal-box">
        <h3>Access Required</h3>
        <p id="entitlementMessage"></p>
        <p><strong id="entitlementAmount"></strong></p>
        <p id="entitlementStatus" class="entitlement-status"></p>
        <div class="modal-actions">
          <button id="entitlementPayBtn" class="btn-primary" type="button">Pay</button>
          <button id="entitlementCancelBtn" class="btn-secondary" type="button">Cancel</button>
        </div>
      </div>
    </div>
    `
  );

  modal = document.getElementById("entitlementModal");
  return modal;
}

async function requestPayPerUse({ courseCode, platform, resourceId }) {
  const copy = {
    message:
      "This course was not part of your registered semester courses.\nTo continue, please pay ?500 to unlock this course.",
    amount: "?500",
    payLabel: "Pay ?500",
    successText: "Payment successful. You may proceed."
  };

  const modal = ensureEntitlementModal();
  const messageEl = modal.querySelector("#entitlementMessage");
  const amountEl = modal.querySelector("#entitlementAmount");
  const statusEl = modal.querySelector("#entitlementStatus");
  const payBtn = modal.querySelector("#entitlementPayBtn");
  const cancelBtn = modal.querySelector("#entitlementCancelBtn");

  messageEl.textContent = copy.message;
  amountEl.textContent = copy.amount;
  statusEl.textContent = "";
  payBtn.textContent = copy.payLabel;
  payBtn.disabled = false;
  cancelBtn.disabled = false;

  modal.style.display = "flex";

  return new Promise((resolve) => {
    const cleanup = () => {
      modal.style.display = "none";
      payBtn.onclick = null;
      cancelBtn.onclick = null;
      payBtn.disabled = false;
      cancelBtn.disabled = false;
    };

    payBtn.onclick = async () => {
      payBtn.disabled = true;
      cancelBtn.disabled = true;
      payBtn.textContent = "Processing...";
      statusEl.textContent = "";

      try {
        const payRes = await fetch(`${API_BASE}/api/payments/mock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 500, courseCode, platform })
        });
        const payData = await payRes.json().catch(() => ({}));
        if (!payRes.ok || payData.status !== "success") {
          statusEl.textContent = "Payment failed. Please try again.";
          payBtn.disabled = false;
          cancelBtn.disabled = false;
          payBtn.textContent = copy.payLabel;
          return;
        }

        await fetch(`${API_BASE}/api/access/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: studentProfile?._id || null,
            resourceId: resourceId || courseCode,
            amount: payData.amount || 500,
            reference: payData.reference,
            course_code: courseCode,
            platform
          })
        });

        statusEl.textContent = copy.successText;
        setTimeout(() => {
          cleanup();
          resolve(true);
        }, 700);
      } catch (err) {
        console.error(err);
        statusEl.textContent = "Payment failed. Please try again.";
        payBtn.disabled = false;
        cancelBtn.disabled = false;
        payBtn.textContent = copy.payLabel;
      }
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
  });
}

async function ensurePaidAccess(courseCode, platform, resourceId) {
  return true;
}

function renderPastQuestions(courseCode, items) {
  if (!resultsEl) return;

  if (!Array.isArray(items) || items.length === 0) {
    resultsEl.innerHTML = "<p>Past questions will show here when uploaded.</p>";
    return;
  }

  resultsEl.innerHTML = items
    .map((item) => {
      const isSummary = item.type === "summary";
      const label = isSummary ? "Summary" : "Past Question";
      const buttonLabel = isSummary ? "Open Summary" : "View Past Question";
      const yearText = item.year ? ` • ${item.year}` : "";
      const title = item.title || `${courseCode} ${label}`;

      return `
        <div class="pq-card">
          <h3>${title}</h3>
          <p>${label}${yearText}</p>
          <button class="pq-open-btn" data-course="${courseCode}" data-url="${item.fileUrl}" data-type="${isSummary ? "summary" : "pq"}">
            ${buttonLabel}
          </button>
        </div>
      `;
    })
    .join("");
}

async function loadPastQuestions(courseCode) {
  if (!resultsEl) return;

  resultsEl.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/past-questions/${courseCode}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      resultsEl.innerHTML = `<p>${data.message || "Past questions will show here when uploaded."}</p>`;
      return;
    }

    renderPastQuestions(courseCode, data.items || []);
  } catch (err) {
    console.error(err);
    resultsEl.innerHTML = "<p>Past questions will show here when uploaded.</p>";
  }
}

window.searchCourse = function searchCourse() {
  if (!courseInput || !resultsEl) return;

  const raw = courseInput.value.trim();
  if (!raw) {
    resultsEl.innerHTML = "";
    return;
  }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const courseCode = normalizeCourseCode(raw);
    if (!courseCode) return;
    loadPastQuestions(courseCode);
  }, 300);
};

document.addEventListener("click", async (event) => {
  const btn = event.target.closest(".pq-open-btn");
  if (!btn) return;

  event.preventDefault();
  const courseCode = btn.getAttribute("data-course");
  const url = btn.getAttribute("data-url");
  if (!courseCode || !url) return;

  window.open(url, "_blank", "noopener");
});

document.addEventListener("DOMContentLoaded", async () => {
  await window.ISA_LearningProtection?.activateWatermark();
  await window.ISA_LearningProtection?.addPdfDownloadButton({
    hostSelector: ".page-header",
    buttonText: "Download as PDF",
    fileName: () => {
      const code = normalizeCourseCode(document.getElementById("courseInput")?.value || "past-questions");
      return `${code.toLowerCase()}-past-questions.pdf`;
    },
    courseCode: () => normalizeCourseCode(document.getElementById("courseInput")?.value || "PASTQ"),
    title: "Past Questions & Summaries",
    getContentText: () => {
      const heading = document.querySelector(".page-header h1")?.innerText || "";
      const query = document.getElementById("courseInput")?.value || "";
      const results = document.getElementById("pqResults")?.innerText || "";
      return [heading, `Course: ${query}`, results].filter(Boolean).join("\n\n");
    }
  });

  const watermarkEl = document.querySelector(".system-watermark");
  if (!watermarkEl) return;
  const profile = await loadStudentProfile();
  if (!profile) return;
  const line =
    window.ISA_LearningProtection?.buildWatermarkLine(profile) ||
    "Student • ISA-00000 • IntensiveStudyAcademy.com • 08127796978 • 07073859837";
  watermarkEl.textContent = line;
});




