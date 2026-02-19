module.exports = function getGrade(scorePercent) {
  if (scorePercent >= 70) return { grade: "A", point: 5 };
  if (scorePercent >= 60) return { grade: "B", point: 4 };
  if (scorePercent >= 50) return { grade: "C", point: 3 };
  if (scorePercent >= 45) return { grade: "D", point: 2 };
  if (scorePercent >= 40) return { grade: "E", point: 1 };
  return { grade: "F", point: 0 };
};
