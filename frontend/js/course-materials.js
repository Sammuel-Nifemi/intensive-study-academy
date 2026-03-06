
const MATERIAL_CONTEXT_KEY = "aiAssistantMaterialContext";
const searchInput = document.getElementById("materialsSearch");
const resultsContainer = document.getElementById("materialsResults");

let searchTimer = null;
let allMaterials = [];
let renderedMaterialsCount = 0;

function ensureLockedFeatureModalApi() {
  if (window.lockedFeatureModal?.open) return;
  const overlay = document.createElement("div");
  overlay.id = "lockedFeatureModal";
  overlay.style.cssText =
    "position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.6);z-index:9999;padding:16px;";
  overlay.innerHTML = `
    <div role="dialog" aria-modal="true" aria-labelledby="lfmTitle" style="width:min(420px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 18px 40px rgba(2,6,23,.32);padding:18px;text-align:center;">
      <div aria-hidden="true" style="font-size:1.15rem;line-height:1;margin-bottom:8px;">&#128274;</div>
      <h3 id="lfmTitle" style="margin:0;color:#0f172a;font-size:1.05rem;">Academic Intel is Temporarily Locked</h3>
      <p id="lfmBody" style="margin:10px 0 16px;color:#334155;line-height:1.5;white-space:pre-line;">We are upgrading the intelligence engine.\nAI-powered course analysis will be available soon.</p>
      <button id="lfmOkayBtn" type="button" class="ai-explain-btn" style="min-width:96px;">Okay</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.style.display = "none";
  });
  overlay.querySelector("#lfmOkayBtn")?.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  window.lockedFeatureModal = {
    open(options = {}) {
      const title = String(options.title || "Academic Intel is Temporarily Locked");
      const body = String(
        options.body ||
          "We are upgrading the intelligence engine.\nAI-powered course analysis will be available soon."
      );
      const titleEl = overlay.querySelector("#lfmTitle");
      const bodyEl = overlay.querySelector("#lfmBody");
      if (titleEl) titleEl.textContent = title;
      if (bodyEl) bodyEl.textContent = body;
      overlay.style.display = "flex";
    },
    close() {
      overlay.style.display = "none";
    }
  };
}

function showLockedFeatureModal() {
  ensureLockedFeatureModalApi();
  if (window.lockedFeatureModal?.open) {
    window.lockedFeatureModal.open();
  }
}

function ensureLockedButtonStyles() {
  if (document.getElementById("intelLockedBtnStyles")) return;
  const style = document.createElement("style");
  style.id = "intelLockedBtnStyles";
  style.textContent = `
    .intel-locked-btn {
      opacity: 0.85;
      transition: opacity 0.2s ease;
    }
    .intel-locked-btn:hover,
    .intel-locked-btn:focus-visible {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

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
              <button class="ai-explain-btn intel-locked-btn" type="button" data-context="${context}">&#128274; Ask Academic Intel</button>
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
  event.preventDefault();
  event.stopPropagation();
  showLockedFeatureModal();
});

loadMaterials();
initMaterialsAccordion();
setMaterialsPanelOpen(false);
ensureLockedButtonStyles();

