function applyTheme() {
  const storedTheme = localStorage.getItem("theme");
  const theme = !storedTheme || storedTheme === "classic" ? "academy" : storedTheme;
  if (!storedTheme || storedTheme === "classic") {
    localStorage.setItem("theme", theme);
  }
  document.body.setAttribute("data-theme", theme);
}

function checkAcademicIntelAccess() {
  return false;
}

function ensureLockedFeatureModalApi() {
  if (typeof window.showLockedFeatureModal === "function") return;

  if (window.lockedFeatureModal && typeof window.lockedFeatureModal.open === "function") {
    window.showLockedFeatureModal = function showLockedFeatureModal(options) {
      window.lockedFeatureModal.open(options);
    };
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "lockedFeatureModal";
  overlay.style.cssText =
    "position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.6);z-index:9999;padding:16px;";
  overlay.innerHTML = `
    <div role="dialog" aria-modal="true" aria-labelledby="lfmTitle" style="width:min(420px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 18px 40px rgba(2,6,23,.32);padding:18px;text-align:center;">
      <div aria-hidden="true" style="font-size:1.15rem;line-height:1;margin-bottom:8px;">&#128274;</div>
      <h3 id="lfmTitle" style="margin:0;color:#0f172a;font-size:1.05rem;">Academic Intel is Temporarily Locked</h3>
      <p id="lfmBody" style="margin:10px 0 16px;color:#334155;line-height:1.5;white-space:pre-line;">We are upgrading the intelligence engine.\nAI-powered course analysis will be available soon.</p>
      <button id="lfmOkayBtn" type="button" style="min-width:96px;padding:8px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;">Okay</button>
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

  window.showLockedFeatureModal = function showLockedFeatureModal(options) {
    window.lockedFeatureModal.open(options);
  };
}

function lockAcademicIntelSidebarLink(link) {
  if (!link || link.dataset.intelLockBound === "1") return;
  link.dataset.intelLockBound = "1";

  const text = String(link.textContent || "").trim();
  if (!text.startsWith("🔒")) {
    link.textContent = `🔒 ${text}`;
  }

  link.addEventListener("click", (event) => {
    if (checkAcademicIntelAccess()) return;
    event.preventDefault();
    event.stopPropagation();
    ensureLockedFeatureModalApi();
    window.showLockedFeatureModal?.();
  });
}

function initAcademicIntelAccessControl() {
  window.checkAcademicIntelAccess = checkAcademicIntelAccess;

  const links = document.querySelectorAll(
    '.dashboard-sidebar a[href*="ai-assistant.html"], .dashboard-sidebar a[href*="staff-ai-assistant.html"]'
  );

  links.forEach(lockAcademicIntelSidebarLink);
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  initAcademicIntelAccessControl();
});
