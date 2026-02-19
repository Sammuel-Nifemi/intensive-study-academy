/* =====================================================
   AI POST-MOCK REVIEW (LOCAL LOGIC – SAFE VERSION)
===================================================== */

const aiBtn = document.getElementById("runAiReviewBtn");
const aiBox = document.getElementById("aiReviewBox");

const mockExams =
  JSON.parse(localStorage.getItem("mockExams")) || [];

const lastResult =
  JSON.parse(localStorage.getItem("lastMockResult"));

if (!lastResult) return;

const exam =
  mockExams.find(e => e.id === lastResult.examId);

aiBtn.onclick = () => {
  aiBox.innerHTML = "<strong>AI is analysing your performance…</strong>";

  const wrongAnswers = lastResult.answers.filter(
    a => a.selected !== a.correct
  );

  if (!wrongAnswers.length) {
    aiBox.innerHTML = `
      🎉 Excellent work!  
      You answered all questions correctly.  
      Keep revising lightly and attempt another mock.
    `;
    return;
  }

  let feedbackHTML = `
    <strong>You should focus on the following areas:</strong>
    <ul>
  `;

  wrongAnswers.forEach(ans => {
    const q = exam.questions.find(q => q.id === ans.questionId);

    feedbackHTML += `
      <li>
        <strong>${q.question}</strong><br>
        👉 Review the concept behind this question.<br>
        👉 Re-read course summary and examples.
      </li>
    `;
  });

  feedbackHTML += `
    </ul>
    <p>
      📌 Recommendation:  
      Revise related materials and attempt another mock.
    </p>
  `;

  aiBox.innerHTML = feedbackHTML;
};
