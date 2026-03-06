(() => {
  const STUDENT_LOGIN_URL = "/frontend/pages/student-login.html";

  const applyTheme = () => {
    const theme = localStorage.getItem("theme") || "classic";
    document.body.setAttribute("data-theme", theme);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const safeText = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value ?? "";
  };

  const renderProfile = (profile) => {
    const name = profile?.fullName || profile?.name || "Student";
    safeText("studentName", `${getGreeting()}, ${name}`);
    safeText("profileTitle", profile?.title || "-");
    safeText("profileName", name || "-");
    safeText("profileGender", profile?.gender || "-");
    safeText("profileEmail", profile?.email || "-");
    safeText("profilePhone", profile?.phone || profile?.phoneNumber || "-");
  };

  const renderReferrals = ({ rows, referralCode, totalReferrals }) => {
    const tbody = document.getElementById("referralReportBody");
    const status = document.getElementById("referralSidebarStatus");
    const linkInput = document.getElementById("referralLinkInput");
    if (!tbody || !status || !linkInput) return;

    const code = String(referralCode || "").trim();
    const referralLink = code
      ? `${window.location.origin}/frontend/pages/student-registration.html?ref=${encodeURIComponent(code)}`
      : "";
    linkInput.value = referralLink;

    tbody.innerHTML = "";
    const list = Array.isArray(rows) ? rows : [];
    const total = Number(totalReferrals || list.length || 0);

    if (!list.length) {
      status.textContent = "No referrals yet. Share your link to invite friends.";
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `<td colspan="3">No referrals yet.</td>`;
      tbody.appendChild(emptyRow);
      return;
    }

    status.textContent = `${total} referral(s)`;
    list.slice(0, 8).forEach((row) => {
      const tr = document.createElement("tr");
      const dateText = row?.createdAt
        ? new Date(row.createdAt).toLocaleDateString()
        : "-";
      tr.innerHTML = `
        <td>${row?.fullName || "-"}</td>
        <td>${row?.email || "-"}</td>
        <td>${dateText}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  const loadReferrals = async () => {
    const token = localStorage.getItem("studentToken");
    const status = document.getElementById("referralSidebarStatus");
    const tbody = document.getElementById("referralReportBody");
    if (!token || !status || !tbody) return;

    status.textContent = "Loading referrals...";
    try {
      const res = await fetch(`${((window.ISA_API_ORIGIN || "") + "")}/api/students/my-referrals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        status.textContent = data?.message || "Failed to load referrals.";
        tbody.innerHTML = "";
        return;
      }

      renderReferrals({
        rows: data?.referrals || [],
        referralCode: data?.referralCode || "",
        totalReferrals: data?.totalReferrals || 0
      });
    } catch (err) {
      console.error("Referrals load error:", err);
      status.textContent = "Failed to load referrals.";
      tbody.innerHTML = "";
    }
  };

  const setupReferralSidebarActions = () => {
    const copyBtn = document.getElementById("copyReferralLinkBtn");
    const linkInput = document.getElementById("referralLinkInput");
    const status = document.getElementById("referralSidebarStatus");
    const anchor = document.getElementById("referralSidebarAnchor");
    const card = document.getElementById("referralSection");

    copyBtn?.addEventListener("click", async () => {
      const link = String(linkInput?.value || "").trim();
      if (!link) {
        if (status) status.textContent = "Referral link not available.";
        return;
      }
      try {
        await navigator.clipboard.writeText(link);
        if (status) status.textContent = "Referral link copied.";
      } catch {
        if (status) status.textContent = "Unable to copy link.";
      }
    });

    anchor?.addEventListener("click", (event) => {
      event.preventDefault();
      card?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const setupReviewModal = () => {
    const modal = document.getElementById("reviewModal");
    const openBtn = document.getElementById("openReviewModalBtn");
    const closeBtn = document.getElementById("closeReviewModalBtn");
    const submitBtn = document.getElementById("submitReviewBtn");
    const input = document.getElementById("reviewMessageInput");
    const status = document.getElementById("reviewStatus");
    if (!modal || !openBtn || !closeBtn || !submitBtn || !input || !status) return;

    openBtn.addEventListener("click", () => {
      modal.hidden = false;
      status.textContent = "";
      input.focus();
    });

    closeBtn.addEventListener("click", () => {
      modal.hidden = true;
      input.value = "";
      status.textContent = "";
    });

    submitBtn.addEventListener("click", async () => {
      const token = localStorage.getItem("studentToken");
      const message = String(input.value || "").trim();
      if (!message) {
        status.textContent = "Please write a short message before submitting.";
        return;
      }

      status.textContent = "Submitting...";
      submitBtn.disabled = true;
      try {
        const res = await fetch(`${((window.ISA_API_ORIGIN || "") + "")}/api/student/review`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          status.textContent = data.message || "Unable to submit now. Please try again.";
          return;
        }
        status.textContent = "Thanks. Your request has been submitted.";
        input.value = "";
        setTimeout(() => {
          modal.hidden = true;
          status.textContent = "";
        }, 900);
      } catch (err) {
        console.error("Review submission error:", err);
        status.textContent = "Unable to submit now. Please try again.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  };

  const boot = async () => {
    try {
      const app = document.getElementById("dashboardApp");
      const loader = document.getElementById("dashboardLoader");
      if (loader) loader.style.display = "flex";
      if (app) app.style.display = "none";

      applyTheme();

      const token = localStorage.getItem("studentToken");
      if (!token) {
        window.location.href = STUDENT_LOGIN_URL;
        return;
      }
      setupReviewModal();
      setupReferralSidebarActions();

      const cached = window.readStudentCache ? window.readStudentCache() : null;
      if (cached) {
        renderProfile(cached);
        if (window.hydrateStudentHeader) window.hydrateStudentHeader(cached);
        if (loader) loader.style.display = "none";
        if (app) app.style.display = "block";
      }

      const profile = window.loadStudent
        ? await window.loadStudent({ force: true })
        : cached;

      if (profile) {
        renderProfile(profile);
        if (window.hydrateStudentHeader) window.hydrateStudentHeader(profile);
      } else if (!cached) {
        safeText("studentName", `${getGreeting()}, Student`);
        safeText("profileTitle", "-");
        safeText("profileName", "Student");
        safeText("profileGender", "-");
        safeText("profileEmail", "-");
        safeText("profilePhone", "-");
      }

      await loadReferrals();

      if (loader) loader.style.display = "none";
      if (app) app.style.display = "block";
    } catch (err) {
      console.error("Student dashboard boot error", err);
      const app = document.getElementById("dashboardApp");
      const loader = document.getElementById("dashboardLoader");
      if (loader) loader.style.display = "none";
      if (app) app.style.display = "block";
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    try {
      boot();
    } catch (err) {
      console.error("Dashboard fatal error", err);
    }
  });
})();


