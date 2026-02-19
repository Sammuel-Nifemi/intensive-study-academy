


/* ===============================
   COURSE DATA APPROVAL QUEUE
================================ */
const pendingCourseUploads =
  JSON.parse(localStorage.getItem("pendingCourseUploads")) || [];




  /* ===============================
   COURSE & FEE DATA APPROVAL
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("materialsTableBody");
  const modal = document.getElementById("viewMaterialModal");
  const modalContent = document.getElementById("modalContent");

  if (!tableBody) return;

  let pendingCourseUploads =
    JSON.parse(localStorage.getItem("pendingCourseUploads")) || [];

  // Render course data rows
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

  // Handle course actions
  tableBody.addEventListener("click", (e) => {
    const id = Number(e.target.dataset.id);
    if (!id) return;

    const item = pendingCourseUploads.find(i => i.id === id);
    if (!item) return;

    // Preview
    if (e.target.classList.contains("view-course")) {
      modalContent.innerHTML =
        `<pre>${JSON.stringify(item.payload, null, 2)}</pre>`;
      modal.classList.add("active");
    }

    // Approve
    if (e.target.classList.contains("approve-course")) {
      if (!confirm("Approve this course & fee data?")) return;

      const approved =
        JSON.parse(localStorage.getItem("approvedCourseCatalog")) || [];

      approved.push(item.payload);

      pendingCourseUploads =
        pendingCourseUploads.filter(i => i.id !== id);

      localStorage.setItem(
        "approvedCourseCatalog",
        JSON.stringify(approved)
      );
      localStorage.setItem(
        "pendingCourseUploads",
        JSON.stringify(pendingCourseUploads)
      );

      alert("✅ Course & fee data approved");
      location.reload();
    }

    // Reject
    if (e.target.classList.contains("reject-course")) {
      if (!confirm("Reject this course & fee data?")) return;

      pendingCourseUploads =
        pendingCourseUploads.filter(i => i.id !== id);

      localStorage.setItem(
        "pendingCourseUploads",
        JSON.stringify(pendingCourseUploads)
      );

      alert("❌ Course & fee data rejected");
      location.reload();
    }
  });

  // Close modal
  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  });
});
