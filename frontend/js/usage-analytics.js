
/* ================= LOAD DATA ================= */
const students =
  JSON.parse(localStorage.getItem("students")) || [];

document.getElementById("totalStudents").textContent = students.length;

/* ================= AGGREGATION ================= */
const byState = {};
const byCenter = {};

students.forEach(s => {
  if (s.state) {
    byState[s.state] = (byState[s.state] || 0) + 1;
  }

  if (s.studyCenter) {
    byCenter[s.studyCenter] = (byCenter[s.studyCenter] || 0) + 1;
  }
});

/* ================= LARGEST CENTER ================= */
let largestCenter = "—";
let max = 0;

Object.entries(byCenter).forEach(([center, count]) => {
  if (count > max) {
    max = count;
    largestCenter = `${center} (${count})`;
  }
});

document.getElementById("largestCenter").textContent = largestCenter;

/* ================= STATE CHART ================= */
new Chart(document.getElementById("stateChart"), {
  type: "bar",
  data: {
    labels: Object.keys(byState),
    datasets: [{
      label: "Students",
      data: Object.values(byState)
    }]
  }
});

/* ================= CENTER CHART ================= */
new Chart(document.getElementById("centerChart"), {
  type: "bar",
  data: {
    labels: Object.keys(byCenter),
    datasets: [{
      label: "Students",
      data: Object.values(byCenter)
    }]
  }
});
