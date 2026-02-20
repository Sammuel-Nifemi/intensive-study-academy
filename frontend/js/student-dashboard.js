(() => {
  const API_BASE = (window.ISA_API_ORIGIN || "") + "";

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

  const setDirectiveCard = (profile) => {
    const card = document.querySelector(".directive-card");
    if (!card) return;

    const courses = Array.isArray(profile?.registeredCourses)
      ? profile.registeredCourses.filter(Boolean)
      : [];

    if (!courses.length) {
      card.innerHTML = `
        <h2>Course Registration Status</h2>
        <p>Have you registered your courses on the NOUN portal yet?</p>
        <div class="directive-actions">
          <a class="primary-btn" href="/frontend/pages/select-courses.html">Select My Courses</a>
          <a class="secondary-btn" href="/frontend/pages/fees.html">Use Fee Analyzer (Guide)</a>
        </div>
        <div class="directive-hints">
          <p><strong>Select My Courses:</strong> Choose your registered courses to unlock materials and mocks.</p>
          <p><strong>Use Fee Analyzer:</strong> Preview expected courses and fees for your semester.</p>
        </div>
      `;
      return;
    }

    const list = courses
      .map((code) => `<li>${code}</li>`)
      .join("");

    card.innerHTML = `
      <h2>Registered Courses</h2>
      <p>Great! You have already selected your courses for this semester.</p>
      <ul class="activity-list">${list}</ul>
      <div class="directive-actions">
        <a class="secondary-btn" href="/frontend/pages/select-courses.html">Edit Course Selection</a>
      </div>
    `;
  };

  const renderProfile = (profile) => {
    const name = profile?.fullName || profile?.name || "Student";
    safeText("studentName", `${getGreeting()}, ${name}`);
    safeText("profileTitle", profile?.title || "-");
    safeText("profileName", name || "-");
    safeText("profileGender", profile?.gender || "-");
    safeText("profileEmail", profile?.email || "-");
    safeText("profilePhone", profile?.phone || profile?.phoneNumber || "-");
    setDirectiveCard(profile);
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
        const res = await fetch(`${API_BASE}/api/student/review`, {
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
      if (loader) loader.style.display = "none";
      if (app) app.style.display = "block";

      applyTheme();

      const token = localStorage.getItem("studentToken");
      if (!token) {
        return;
      }
      setupReviewModal();

      const cached = window.readStudentCache ? window.readStudentCache() : null;
      if (cached) {
        renderProfile(cached);
        if (window.hydrateStudentHeader) window.hydrateStudentHeader(cached);
      }

      const profile = window.loadStudent
        ? await window.loadStudent({ force: !cached })
        : cached;

      if (profile) {
        renderProfile(profile);
        if (window.hydrateStudentHeader) window.hydrateStudentHeader(profile);
      }
    } catch (err) {
      console.error("Student dashboard boot error", err);
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

