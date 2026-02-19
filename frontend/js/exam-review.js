
const result = JSON.parse(localStorage.getItem("lastAttempt"));
if (!result) window.location.href = "mock-exams.html";

document.getElementById("score").textContent =
  `Score: ${result.score} / ${result.total}`;

document.getElementById("aiBtn").addEventListener("click", () => {
  window.location.href = "ai-assistant.html";
});
const token = localStorage.getItem("studentToken");
const attempt = JSON.parse(localStorage.getItem("lastAttempt"));

if (!token || !attempt) {
  window.location.href = "mock-exams.html";
}

(async () => {
  const res = await fetch(
    `http://localhost:5000/api/reviews/${attempt.attemptId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  document.getElementById("examTitle").textContent = data.title;
  document.getElementById("score").textContent =
    `Score: ${data.score} / ${data.total}`;

  const container = document.getElementById("reviewContainer");
  container.innerHTML = "";

  data.review.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "review-question";

    div.innerHTML = `
      <p><strong>Q${index + 1}:</strong> ${item.question}</p>
      <p>Your answer: ${item.studentAnswer || "None"}</p>
      <p>Correct answer: ${item.correctAnswer}</p>
      ${
        item.isCorrect
          ? "<p style='color:green'>✔ Correct</p>"
          : "<p style='color:red'>✘ Wrong</p>"
      }
    `;

    container.appendChild(div);
  });

  // Save wrong questions for AI
  localStorage.setItem(
    "wrongQuestions",
    JSON.stringify(data.review.filter(r => !r.isCorrect))
  );
})();

/* ================= AI EXPLANATION ================= */
document.getElementById("aiExplainBtn").addEventListener("click", () => {
  window.location.href = "ai-assistant.html";
});

