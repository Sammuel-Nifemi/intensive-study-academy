document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  await loadPrograms();
  setupAnalyzeHandler();
});

function applyTheme() {
  const theme = localStorage.getItem("theme") || "classic";
  document.body.setAttribute("data-theme", theme);
}

function setStatus(message, isError) {
  const status = document.getElementById("feesStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", Boolean(isError));
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `?${amount.toLocaleString()}`;
}

async function fetchFees(params) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`http://localhost:5000/api/fees/analyze?${query}`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = data?.message || "Unable to load fee breakdown. Please try again.";
      setStatus(message, true);
      return;
    }

    renderFees(data, params);
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Unable to load fee breakdown. Please check your connection.", true);
  }
}

function renderFees(payload, params) {
  const { courses, totals } = payload || {};

  const feeHeader = document.getElementById("feeHeader");
  if (feeHeader) {
    const program = params?.program || "Program";
    const level = params?.level || "";
    const semester = params?.semester || "";
    feeHeader.textContent = `Fee Analysis for ${program} – ${level} (${semester})`;
  }

  const tbody = document.getElementById("feeTableBody");
  if (tbody) {
    tbody.innerHTML = (courses || [])
      .map((course, index) => {
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${course.code || ""}</td>
            <td>${course.title || course.code || ""}</td>
            <td>${course.units ?? ""}</td>
            <td>${formatCurrency(course.courseFee)}</td>
            <td>${formatCurrency(course.examFee)}</td>
            <td>${course.materialUrl ? `<a href="${course.materialUrl}" target="_blank">Open</a>` : "—"}</td>
          </tr>
        `;
      })
      .join("");
  }

  setText("totalUnits", totals?.totalUnits);
  setText("totalCourseFee", formatCurrency(totals?.totalCourseFee));
  setText("totalExamFee", formatCurrency(totals?.totalExamFee));
  setText("grandTotal", formatCurrency(totals?.grandTotal));

  const downloadBtn = document.getElementById("downloadFeeSlipBtn");
  if (downloadBtn) {
    downloadBtn.onclick = () => generateFeeSlip(payload, params);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value ?? "";
}

function generateFeeSlip(payload, params) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    alert("PDF generator not available. Please try again.");
    return;
  }

  const doc = new jsPDF();
  const { courses, totals } = payload || {};

  doc.setFontSize(16);
  doc.text("Intensive Study Academy", 14, 18);

  doc.setFontSize(10);
  doc.text("www.intensivestudyacademy.com", 14, 24);
  doc.text("Phone: +234 707 385 9837", 14, 29);

  doc.setTextColor(220);
  doc.setFontSize(48);
  doc.text("ISA", 35, 160, { angle: 45 });
  doc.setTextColor(0);

  doc.setFontSize(12);
  doc.text(
    `Fee Analysis: ${params?.program || ""} - ${params?.level || ""} (${params?.semester || ""})`,
    14,
    40
  );

  doc.setFontSize(10);
  doc.text(`Faculty: ${params?.faculty || ""}`, 14, 47);

  let y = 60;
  doc.setFontSize(10);
  doc.text("Code", 14, y);
  doc.text("Title", 40, y);
  doc.text("Units", 120, y);
  doc.text("Course", 150, y);
  doc.text("Exam", 175, y);

  y += 6;
  (courses || []).forEach(course => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(course.code || ""), 14, y);
    doc.text(String(course.title || course.code || ""), 40, y, { maxWidth: 70 });
    doc.text(String(course.units ?? ""), 120, y);
    doc.text(formatCurrency(course.courseFee ?? 0), 150, y);
    doc.text(formatCurrency(course.examFee ?? 0), 175, y);
    y += 6;
  });

  y += 8;
  doc.text(`Total Units: ${totals?.totalUnits ?? 0}`, 14, y);
  y += 5;
  doc.text(`Total Course Fee: ${formatCurrency(totals?.totalCourseFee ?? 0)}`, 14, y);
  y += 5;
  doc.text(`Total Exam Fee: ${formatCurrency(totals?.totalExamFee ?? 0)}`, 14, y);
  y += 6;
  doc.setFontSize(12);
  doc.text(`GRAND TOTAL: ${formatCurrency(totals?.grandTotal ?? 0)}`, 14, y);

  doc.setFontSize(10);
  doc.text(
    "Get more academic resources on our website",
    14,
    285
  );

  doc.save("fee-slip.pdf");
  alert("Your fee slip is downloading. Kindly check your notifications.");
}

async function loadPrograms() {
  const facultySelect = document.getElementById("feeFacultySelect");
  const programSelect = document.getElementById("feeProgramSelect");
  if (!facultySelect || !programSelect) return;

  try {
    const res = await fetch("http://localhost:5000/api/admin/public/programs");
    const programs = await res.json().catch(() => []);
    if (!res.ok) {
      setStatus("Unable to load programs. Please refresh.", true);
      return;
    }

    const list = Array.isArray(programs) ? programs : [];
    const faculties = Array.from(new Set(list.map((p) => p.facultyName).filter(Boolean)));
    facultySelect.innerHTML = '<option value="">Select faculty</option>';
    faculties.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      facultySelect.appendChild(option);
    });

    const setProgramsForFaculty = (facultyName) => {
      programSelect.innerHTML = '<option value="">Select program</option>';
      list
        .filter((p) => !facultyName || p.facultyName === facultyName)
        .forEach((p) => {
          const option = document.createElement("option");
          option.value = p.name;
          option.textContent = p.name;
          programSelect.appendChild(option);
        });
    };

    facultySelect.addEventListener("change", () => {
      setProgramsForFaculty(facultySelect.value);
    });

    setProgramsForFaculty(facultySelect.value);
  } catch (err) {
    console.error(err);
    setStatus("Unable to load programs. Please refresh.", true);
  }
}

function setupAnalyzeHandler() {
  const btn = document.getElementById("feeAnalyzeBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const faculty = document.getElementById("feeFacultySelect")?.value || "";
    const program = document.getElementById("feeProgramSelect")?.value || "";
    const level = document.getElementById("feeLevelSelect")?.value || "";
    const semester = document.getElementById("feeSemesterSelect")?.value || "";

    if (!faculty || !program || !level || !semester) {
      setStatus("Select faculty, program, level, and semester to continue.", true);
      return;
    }

    setStatus("Analyzing fees...");
    await fetchFees({ faculty, program, level, semester });
  });
}
