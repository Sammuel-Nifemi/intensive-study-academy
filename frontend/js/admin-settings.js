(function () {
  const storedAdminToken = (localStorage.getItem("adminToken") || localStorage.getItem("token")) || "";

  const themeSelect = document.getElementById("adminTheme");
  const saveBtn = document.getElementById("saveSettingsBtn");
  const statusEl = document.getElementById("settingsStatus");
  const THEME_OPTIONS = ["emerald", "slate", "royal", "sunset", "mono"];

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("error", Boolean(isError));
  }

  async function loadSettings() {
    const localTheme = localStorage.getItem("adminTheme");
    if (localTheme && themeSelect) {
      themeSelect.value = localTheme;
    }

    if (!storedAdminToken) return;

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/settings", {
        headers: { Authorization: `Bearer ${storedAdminToken}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("token");
        setStatus("Session expired. Please log in again.", true);
        setTimeout(() => {
          window.location.href = "./admin-login.html";
        }, 1200);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (data?.theme && themeSelect && !localTheme) {
        const normalized = window.normalizeAdminTheme
          ? window.normalizeAdminTheme(data.theme)
          : data.theme;
        if (THEME_OPTIONS.includes(normalized)) {
          themeSelect.value = normalized;
          localStorage.setItem("adminTheme", normalized);
          if (window.applyAdminTheme) window.applyAdminTheme(normalized);
        }
      }
    } catch {
      // ignore load errors
    }
  }

  async function saveSettings() {
    if (!themeSelect) return;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }
    const theme = themeSelect.value;
    localStorage.setItem("adminTheme", theme);
    if (window.applyAdminTheme) window.applyAdminTheme(theme);

    if (!storedAdminToken) {
      setStatus("Saved locally", false);
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Settings";
      }
      return;
    }

    setStatus("Saving...", false);
    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAdminToken}`
        },
        body: JSON.stringify({ theme })
      });

      if (res.status === 401) {
        setStatus("Session expired. Please log in again.", true);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("token");
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Settings";
        }
        setTimeout(() => {
          window.location.href = "./admin-login.html";
        }, 1200);
        return;
      }
      if (!res.ok) {
        setStatus("Failed to save settings", true);
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Settings";
        }
        return;
      }

      setStatus("Settings saved", false);
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Settings";
      }
    } catch {
      setStatus("Failed to save settings", true);
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Settings";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    saveBtn?.addEventListener("click", saveSettings);
    themeSelect?.addEventListener("change", () => {
      const theme = themeSelect.value;
      localStorage.setItem("adminTheme", theme);
      if (window.applyAdminTheme) window.applyAdminTheme(theme);
    });
  });
})();

