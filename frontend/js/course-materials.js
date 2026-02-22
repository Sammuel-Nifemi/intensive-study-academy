
const MATERIAL_CONTEXT_KEY = "aiAssistantMaterialContext";
const searchInput = document.getElementById("materialsSearch");
const resultsContainer = document.getElementById("materialsResults");

let searchTimer = null;
let allMaterials = [];
let renderedMaterialsCount = 0;

function setMaterialsListMeta(text) {
  const meta = document.getElementById("materialsListMeta");
  if (meta) meta.textContent = text;
}

function setMaterialsPanelOpen(isOpen) {
  const panel = document.getElementById("materialsListPanel");
  const toggle = document.getElementById("materialsListToggle");
  if (!panel || !toggle) return;
  panel.hidden = !isOpen;
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  setMaterialsListMeta(isOpen ? `Hide (${renderedMaterialsCount})` : `Open (${renderedMaterialsCount})`);
}

function initMaterialsAccordion() {
  const toggle = document.getElementById("materialsListToggle");
  if (!toggle || toggle.dataset.wired === "1") return;
  toggle.dataset.wired = "1";
  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setMaterialsPanelOpen(!isOpen);
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeFileUrl(fileUrl) {
  if (!fileUrl) return "#";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${((window.ISA_API_ORIGIN || "") + "")}${fileUrl}`;
}

function renderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    renderedMaterialsCount = 0;
    setMaterialsListMeta("Open (0)");
    resultsContainer.innerHTML = '<p class="muted">No materials found.</p>';
    return;
  }
  renderedMaterialsCount = items.length;
  setMaterialsListMeta(`Open (${renderedMaterialsCount})`);

  resultsContainer.innerHTML = items
    .map((item) => {
      const title = escapeHtml(item.title || "Untitled");
      const code = escapeHtml(item.courseCode || "General");
      const level = escapeHtml(item.level || "N/A");
      const semester = escapeHtml(item.semester || "N/A");
      const url = normalizeFileUrl(item.fileUrl);
      const context = escapeHtml(
        [
          `Title: ${item.title || "Untitled"}`,
          `Course: ${item.courseCode || "General"}`,
          `Level: ${item.level || "N/A"}`,
          `Semester: ${item.semester || "N/A"}`,
          item.description ? `Description: ${item.description}` : "",
          item.summary ? `Summary: ${item.summary}` : ""
        ]
          .filter(Boolean)
          .join("\n")
      );
      return `
        <article class="material-accordion-card">
          <button class="material-accordion-trigger" type="button">
            <span>${title}</span>
            <span class="material-accordion-meta">Course: ${code}</span>
          </button>
          <div class="material-accordion-body">
            <p class="result-meta">Level: ${level}</p>
            <p class="result-meta">Semester: ${semester}</p>
            <div class="result-actions">
              <a class="download-btn" href="${url}" target="_blank" rel="noopener">Download PDF</a>
              <button class="ai-explain-btn" type="button" data-context="${context}">Ask NOVA</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function filterMaterials(query = "") {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return allMaterials;
  return allMaterials.filter((item) => {
    return String(item.title || "").toLowerCase().includes(q) ||
      String(item.courseCode || "").toLowerCase().includes(q);
  });
}

async function loadMaterials() {
  try {
    const endpoint = `${((window.ISA_API_ORIGIN || "") + "")}/api/materials/public`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
      resultsContainer.innerHTML = `<p class="muted">${escapeHtml(data.message || "Failed to load materials.")}</p>`;
      return;
    }

    allMaterials = Array.isArray(data) ? data : [];
    renderItems(allMaterials);
  } catch (error) {
    console.error(error);
    resultsContainer.innerHTML = '<p class="muted">Failed to load materials.</p>';
  }
}

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    renderItems(filterMaterials(query));
  }, 250);
});

resultsContainer?.addEventListener("click", (event) => {
  const trigger = event.target.closest(".material-accordion-trigger");
  if (trigger) {
    const card = trigger.closest(".material-accordion-card");
    if (card) card.classList.toggle("open");
    return;
  }

  const btn = event.target.closest(".ai-explain-btn");
  if (!btn) return;
  const context = String(btn.getAttribute("data-context") || "").trim();
  if (!context) return;
  localStorage.setItem(MATERIAL_CONTEXT_KEY, context);
  window.location.href = "/pages/ai-assistant.html";
});

loadMaterials();
initMaterialsAccordion();
setMaterialsPanelOpen(false);

