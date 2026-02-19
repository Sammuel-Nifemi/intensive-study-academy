import { usageData } from "./usage-tracker.js";

export function trackUsage(studentId, type) {
  const student = usageData.find(u => u.studentId === studentId);
  if (!student) return;

  if (student[type]) {
    student[type].count += 1;
  }
}

export function canUseFree(studentId, type) {
  const student = usageData.find(u => u.studentId === studentId);
  if (!student || !student[type]) return false;

  return student[type].count < student[type].freeLimit;
}
