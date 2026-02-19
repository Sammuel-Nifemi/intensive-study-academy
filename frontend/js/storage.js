
export function getPendingUploads() {
  return JSON.parse(localStorage.getItem("pendingCourseUploads")) || [];
}

export function setPendingUploads(data) {
  localStorage.setItem("pendingCourseUploads", JSON.stringify(data));
}

export function getApprovedCatalog() {
  return JSON.parse(localStorage.getItem("approvedCourseCatalog")) || [];
}

export function setApprovedCatalog(data) {
  localStorage.setItem("approvedCourseCatalog", JSON.stringify(data));
}
