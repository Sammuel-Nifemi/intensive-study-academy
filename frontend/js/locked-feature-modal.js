(function initLockedFeatureModal(global) {
  if (global.lockedFeatureModal) return;

  const MODAL_ID = "lockedFeatureModal";
  const DEFAULT_TITLE = "Academic Intel is Temporarily Locked";
  const DEFAULT_BODY =
    "We are upgrading the intelligence engine.\nAI-powered course analysis will be available soon.";
  let overlay;

  function ensureStyles() {
    if (document.getElementById("lockedFeatureModalStyles")) return;
    const style = document.createElement("style");
    style.id = "lockedFeatureModalStyles";
    style.textContent = `
      #${MODAL_ID} {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.6);
        z-index: 9999;
        padding: 16px;
      }
      #${MODAL_ID}.open {
        display: flex;
      }
      #${MODAL_ID} .lfm-dialog {
        width: min(420px, 100%);
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        box-shadow: 0 18px 40px rgba(2, 6, 23, 0.32);
        padding: 18px;
        text-align: center;
      }
      #${MODAL_ID} .lfm-lock {
        font-size: 1.15rem;
        margin-bottom: 8px;
        line-height: 1;
      }
      #${MODAL_ID} .lfm-title {
        margin: 0;
        color: #0f172a;
        font-size: 1.05rem;
      }
      #${MODAL_ID} .lfm-body {
        margin: 10px 0 16px;
        color: #334155;
        line-height: 1.5;
        white-space: pre-line;
      }
      #${MODAL_ID} .lfm-actions {
        display: flex;
        justify-content: center;
      }
      #${MODAL_ID} .lfm-ok {
        min-width: 96px;
      }
    `;
    document.head.appendChild(style);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("open");
  }

  function ensureModal() {
    if (overlay) return overlay;
    ensureStyles();

    overlay = document.createElement("div");
    overlay.id = MODAL_ID;
    overlay.innerHTML = `
      <div class="lfm-dialog" role="dialog" aria-modal="true" aria-labelledby="lfmTitle">
        <div class="lfm-lock" aria-hidden="true">&#128274;</div>
        <h3 class="lfm-title" id="lfmTitle"></h3>
        <p class="lfm-body" id="lfmBody"></p>
        <div class="lfm-actions">
          <button type="button" class="primary-btn lfm-ok" id="lfmOkayBtn">Okay</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    const okBtn = overlay.querySelector("#lfmOkayBtn");
    okBtn?.addEventListener("click", close);

    return overlay;
  }

  function open(options = {}) {
    const modal = ensureModal();
    const title = String(options.title || DEFAULT_TITLE);
    const body = String(options.body || DEFAULT_BODY);

    const titleEl = modal.querySelector("#lfmTitle");
    const bodyEl = modal.querySelector("#lfmBody");
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;

    modal.classList.add("open");
  }

  global.lockedFeatureModal = {
    open,
    close
  };
  global.showLockedFeatureModal = function showLockedFeatureModal(options) {
    global.lockedFeatureModal.open(options);
  };
})(window);
