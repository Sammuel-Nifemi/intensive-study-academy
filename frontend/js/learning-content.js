(function initLearningContent() {
  const BRAND_LINE = "IntensiveStudyAcademy.com - 08127796978 - 07073859837";
  const PDF_BUTTON_ID = "downloadLearningPdfBtn";

  function normalize(value, fallback) {
    const text = String(value || "").trim();
    return text || fallback;
  }

  async function getProfile() {
    if (window.__learningProfileCache) return window.__learningProfileCache;
    if (!window.loadStudent) return null;
    const profile = await window.loadStudent();
    window.__learningProfileCache = profile || null;
    return window.__learningProfileCache;
  }

  function buildWatermarkLine(profile) {
    const alias = normalize(profile?.studentAlias, "Student");
    const studentId = normalize(profile?.isaStudentId, "ISA-00000");
    return `${alias} - ${studentId} - ${BRAND_LINE}`;
  }

  function ensureWatermarkLayer() {
    let el = document.getElementById("learningWatermark");
    if (el) return el;
    el = document.createElement("div");
    el.id = "learningWatermark";
    el.className = "learning-watermark";
    document.body.appendChild(el);
    return el;
  }

  async function applyWatermark() {
    const profile = await getProfile();
    const line = buildWatermarkLine(profile);
    const overlay = ensureWatermarkLayer();
    const safeLine = line.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='540' height='320'>
        <g transform='rotate(-28 270 160)'>
          <text x='8' y='165' fill='rgba(70,70,70,0.33)' font-size='16' font-family='Arial,sans-serif'>${safeLine}</text>
        </g>
      </svg>
    `;
    overlay.style.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    document.body.classList.add("learning-content-protected");
  }

  function improveExplanation(params) {
    const topic = normalize(params?.topic, "the topic");
    const question = normalize(params?.question, "the question");
    const answer = normalize(params?.correctAnswer, "the correct answer");
    const example = normalize(params?.example, "a simple real-life example");

    return [
      `Tutor explanation for ${topic}:`,
      "",
      "1. First, understand the main idea.",
      `The question is asking about ${question.toLowerCase()}.`,
      "",
      "2. Now reason step by step.",
      "- Start from the core definition.",
      "- Match that definition to what the question is testing.",
      "- Remove options that do not fit.",
      `- The best answer is: ${answer}.`,
      "",
      "3. Simple example.",
      `Think of ${example}. This is similar because it follows the same logic.`,
      "",
      "4. Quick memory tip.",
      "If you can explain it in one short sentence, you understand it."
    ].join("\n");
  }

  function getPageType() {
    const path = String(window.location.pathname || "").toLowerCase();
    if (path.includes("mock-exams")) return "mock";
    if (path.includes("past-questions")) return "past";
    if (path.includes("course-summary")) return "summary";
    if (path.includes("ai-assistant")) return "ai";
    return "other";
  }

  function hasRenderableContent(pageType) {
    if (pageType === "mock") {
      const resultSection = document.getElementById("resultSection");
      const summary = normalize(document.getElementById("resultSummary")?.innerText, "");
      const explanations = normalize(document.getElementById("explanations")?.innerText, "");
      return Boolean(resultSection && !resultSection.hidden && (summary || explanations));
    }

    if (pageType === "past") {
      const courseInput = normalize(document.getElementById("courseInput")?.value, "");
      const hasCards = Boolean(document.querySelector("#pqResults .pq-card"));
      return Boolean(courseInput && hasCards);
    }

    if (pageType === "summary") {
      const content = normalize(document.getElementById("summaryContent")?.innerText, "");
      const status = normalize(document.getElementById("summaryStatus")?.innerText, "");
      return Boolean(content && !status);
    }

    if (pageType === "ai") {
      const output = normalize(document.getElementById("aiReviewOutput")?.innerText, "");
      return Boolean(output);
    }

    return false;
  }

  function getExportPayload(pageType) {
    const title =
      normalize(document.querySelector(".page-header h1")?.textContent, "") ||
      normalize(document.title, "Learning Content");

    if (pageType === "mock") {
      const timer = normalize(document.getElementById("examTimer")?.innerText, "");
      const result = normalize(document.getElementById("resultSummary")?.innerText, "");
      const explanations = normalize(document.getElementById("explanations")?.innerText, "");
      return {
        title,
        content: [timer, result, explanations].filter(Boolean).join("\n\n"),
        fileName: "mock-exam-report.pdf"
      };
    }

    if (pageType === "past") {
      const course = normalize(document.getElementById("courseInput")?.value, "");
      const list = normalize(document.getElementById("pqResults")?.innerText, "");
      return {
        title,
        content: [`Course: ${course}`, list].filter(Boolean).join("\n\n"),
        fileName: "past-questions-report.pdf"
      };
    }

    if (pageType === "summary") {
      const code = normalize(document.getElementById("summaryCourseInput")?.value, "");
      const body = normalize(document.getElementById("summaryContent")?.innerText, "");
      return {
        title,
        content: [`Course: ${code}`, body].filter(Boolean).join("\n\n"),
        fileName: "summary-report.pdf"
      };
    }

    if (pageType === "ai") {
      const output = normalize(document.getElementById("aiReviewOutput")?.innerText, "");
      return {
        title,
        content: output,
        fileName: "ai-explanation-report.pdf"
      };
    }

    return {
      title,
      content: normalize(document.querySelector("main")?.innerText, ""),
      fileName: "learning-content.pdf"
    };
  }

  function removeAllPdfButtons() {
    const own = document.getElementById(PDF_BUTTON_ID);
    if (own) own.remove();
    document.querySelectorAll(".isa-download-btn").forEach((el) => el.remove());
  }

  function ensureHost() {
    const candidates = [".page-header", ".dashboard-section", "main"];
    return candidates.map((s) => document.querySelector(s)).find(Boolean) || null;
  }

  function ensureSinglePdfButton(pageType) {
    if (!window.PDFExport) return;
    const host = ensureHost();
    if (!host) return;

    let button = document.getElementById(PDF_BUTTON_ID);
    if (!button) {
      button = document.createElement("button");
      button.id = PDF_BUTTON_ID;
      button.type = "button";
      button.className = "primary-btn learning-download-btn";
      button.textContent = "Download as PDF";
      host.appendChild(button);
    }

    button.onclick = async () => {
      try {
        const payload = getExportPayload(pageType);
        await window.PDFExport.payAndExport(payload);
      } catch (err) {
        console.error("PDF export error:", err);
        alert(err.message || "Failed to export PDF");
      }
    };
  }

  function managePdfButton() {
    const pageType = getPageType();
    const shouldShow = hasRenderableContent(pageType);
    removeAllPdfButtons();
    if (shouldShow) {
      ensureSinglePdfButton(pageType);
    }
  }

  function watchForContentChanges() {
    let timer = null;
    const queue = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(managePdfButton, 60);
    };

    const obs = new MutationObserver(queue);
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    document.addEventListener("input", queue);
    document.addEventListener("change", queue);
    window.addEventListener("hashchange", queue);
    window.addEventListener("popstate", queue);
    setInterval(managePdfButton, 1500);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await applyWatermark();
    managePdfButton();
    watchForContentChanges();
  });

  window.LearningContent = {
    applyWatermark,
    improveExplanation,
    buildWatermarkLine
  };
})();
