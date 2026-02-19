/* =====================================================
   COURSE & FEE DATA APPROVAL (BACKEND-READY)
   ===================================================== */

import {
  getPendingUploads,
  setPendingUploads,
  getApprovedCatalog,
  setApprovedCatalog
} from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("materialsTableBody");
  const modal = document.getElementById("viewMaterialModal");
  const modalContent = document.getElementById("modalContent");

  if (!tableBody) return;

  let pendingCourseUploads = getPendingUploads();
  let approvedCatalog = getApprovedCatalog();

  /* ===============================
     RENDER TABLE
  ================================ */
  function renderTable() {
    tableBody.innerHTML = "";

    if (pendingCourseUploads.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;">
            No pending submissions
          </td>
        </tr>
      `;
      return;
    }

    pendingCourseUploads.forEach(item => {
      if (item.status !== "pending") return;

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${item.payload.program}</td>
        <td>Course & Fee Data</td>
        <td>${item.submittedBy}</td>
        <td>${new Date(item.date).toLocaleDateString()}</td>
        <td><span class="status pending">Pending</span></td>
        <td>
          <button class="btn view-course" data-id="${item.id}">Preview</button>
          <button class="btn approve-course" data-id="${item.id}">Approve</button>
          <button class="btn reject-course" data-id="${item.id}">Reject</button>
        </td>
      `;

      tableBody.appendChild(row);
    });
  }

  renderTable();

  /* ===============================
     ACTION HANDLER
  ================================ */
  tableBody.addEventListener("click", (e) => {
    const id = Number(e.target.dataset.id);
    if (!id) return;

    const item = pendingCourseUploads.find(i => i.id === id);
    if (!item) return;

    // PREVIEW
    if (e.target.classList.contains("view-course")) {
      modalContent.innerHTML =
        `<pre>${JSON.stringify(item.payload, null, 2)}</pre>`;
      modal.classList.add("active");
    }

    // APPROVE
    if (e.target.classList.contains("approve-course")) {
      if (!confirm("Approve this course & fee data?")) return;

      // 🔒 Remove any existing approved record for same program + level + semester
      approvedCatalog = approvedCatalog.filter(existing =>
    !(
    existing.program === item.payload.program &&
    existing.level === item.payload.level &&
    existing.semester === item.payload.semester
      )
      );

     // ✅ Add the newly approved version
      approvedCatalog.push({
  program: item.payload.program,
  level: item.payload.level,
  semester: item.payload.semester,
  courses: item.payload.courses
       });


      pendingCourseUploads =
        pendingCourseUploads.filter(i => i.id !== id);

      setApprovedCatalog(approvedCatalog);
      setPendingUploads(pendingCourseUploads);

      alert("✅ Course & fee data approved and published");
      renderTable();
    }

    // REJECT
    if (e.target.classList.contains("reject-course")) {
      if (!confirm("Reject this course & fee data?")) return;

      pendingCourseUploads =
        pendingCourseUploads.filter(i => i.id !== id);

      setPendingUploads(pendingCourseUploads);

      alert("❌ Course & fee data rejected");
      renderTable();
    }
  });

  /* ===============================
     CLOSE MODAL
  ================================ */
  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  });
});
