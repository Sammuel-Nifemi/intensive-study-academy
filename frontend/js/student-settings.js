document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("studentToken");

  if (!token) {
    window.location.href = "/pages/student-login.html";
    return;
  }

  applyTheme();

  try {
    const cached = window.readStudentCache ? window.readStudentCache() : null;
    const student = cached || (window.loadStudent ? await window.loadStudent() : null);
    if (!student) {
      window.location.href = "/pages/student-login.html";
    }
    // Student name is not shown on non-dashboard pages
  } catch (err) {
    console.error("Profile load error:", err);
    window.location.href = "/pages/student-login.html";
  }

  const academicForm = document.getElementById("academicChangeForm");
  if (academicForm) {
    academicForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        requestedProgram: getValue("requestedProgram"),
        requestedStudyCenter: getValue("requestedStudyCenter"),
        reason: getValue("changeReason")
      };

      if (!payload.requestedProgram && !payload.requestedStudyCenter) {
        alert("Please enter a requested program or study center");
        return;
      }

      try {
        const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/students/me/academic-change-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Failed to submit request");
          return;
        }

        academicForm.reset();
        alert("Academic change request submitted");
      } catch (err) {
        console.error("Academic change request error:", err);
        alert("Server error. Please try again.");
      }
    });
  }

  const complaintForm = document.getElementById("complaintForm");
  if (complaintForm) {
    complaintForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        subject: getValue("complaintSubject"),
        message: getValue("complaintMessage")
      };

      if (!payload.subject || !payload.message) {
        alert("Please enter a subject and message");
        return;
      }

      try {
        const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/students/me/complaints", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Failed to submit complaint");
          return;
        }

        complaintForm.reset();
        alert("Complaint submitted");
      } catch (err) {
        console.error("Complaint error:", err);
        alert("Server error. Please try again.");
      }
    });
  }

  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    const storedTheme = localStorage.getItem("theme") || "classic";
    themeSelect.value = storedTheme;

    themeSelect.addEventListener("change", () => {
      localStorage.setItem("theme", themeSelect.value);
      applyTheme();
    });
  }

  const logout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    window.location.href = "/pages/student-login.html";
  };

  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  document.getElementById("logoutBtnInline")?.addEventListener("click", logout);

  document.getElementById("deleteAccountBtn")?.addEventListener("click", async () => {
    const confirmDelete = confirm("Delete your account? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/students/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete account");
        return;
      }

      localStorage.removeItem("studentToken");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("role");
      window.location.href = "/pages/student-login.html";
    } catch (err) {
      console.error("Delete account error:", err);
      alert("Server error. Please try again.");
    }
  });
});

function set(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
    el.value = value || "";
    return;
  }
  el.textContent = value || "—";
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function applyTheme() {
  const theme = localStorage.getItem("theme") || "classic";
  document.body.setAttribute("data-theme", theme);
}


