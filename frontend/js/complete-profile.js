document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");
  if (urlToken) {
    localStorage.setItem("studentToken", urlToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const token = localStorage.getItem("studentToken");

  if (!token) {
    window.location.href = "/frontend/pages/student-login.html";
    return;
  }

  const programSelect = document.getElementById("program");
  const facultyInput = document.getElementById("faculty");
  const studyCenterSelect = document.getElementById("studyCenter");
  const dobDaySelect = document.getElementById("dobDay");

  if (dobDaySelect) {
    dobDaySelect.innerHTML = `<option value="">Day</option>`;
    for (let day = 1; day <= 31; day += 1) {
      const option = document.createElement("option");
      option.value = String(day);
      option.textContent = String(day);
      dobDaySelect.appendChild(option);
    }
  }

  try {
    const res = await fetch("http://localhost:5000/api/admin/public/programs");
    const programs = await res.json();

    programSelect.innerHTML = `<option value="">Select program</option>`;
    const facultyByProgram = new Map();
    programs.forEach(p => {
      const option = document.createElement("option");
      option.value = p._id;
      option.textContent = p.name;
      const facultyLabel = p.facultyName || "";
      option.dataset.faculty = facultyLabel;
      option.dataset.facultyId = p.facultyId || "";
      facultyByProgram.set(String(p._id), facultyLabel);
      programSelect.appendChild(option);
    });

    if (programSelect.value) {
      programSelect.dispatchEvent(new Event("change"));
    }

    programSelect.addEventListener("change", () => {
      const selected = programSelect.selectedOptions[0];
      const selectedId = programSelect.value;
      facultyInput.value =
        selected?.dataset.faculty ||
        facultyByProgram.get(String(selectedId)) ||
        "";
    });
  } catch (err) {
    console.error("Failed to load programs", err);
  }

  try {
    const res = await fetch("http://localhost:5000/api/study-centers");
    const centers = await res.json();

    studyCenterSelect.innerHTML = `<option value="">Select study center</option>`;
    centers.forEach(c => {
      const option = document.createElement("option");
      option.value = c._id;
      option.textContent = c.name;
      studyCenterSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load study centers", err);
  }

  const form = document.getElementById("completeProfileForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedProgram = programSelect.selectedOptions[0];
    const payload = {
      title: document.getElementById("title").value,
      fullName: document.getElementById("fullName").value,
      gender: document.getElementById("gender").value,
      phone: document.getElementById("phone").value,
      dobDay: document.getElementById("dobDay").value,
      dobMonth: document.getElementById("dobMonth").value,
      studyCenterId: studyCenterSelect.value,
      facultyId: selectedProgram?.dataset.facultyId || "",
      programId: programSelect.value,
      level: document.getElementById("level").value,
      semester: document.getElementById("semester").value
    };

    try {
      const res = await fetch("http://localhost:5000/api/student/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Profile update failed");
        return;
      }

      const prep = document.getElementById("dashboardPrep");
      if (prep) prep.hidden = false;
      form.querySelectorAll("input, select, button").forEach((el) => {
        el.disabled = true;
      });

      setTimeout(() => {
        window.location.href = "/frontend/pages/student-dashboard.html";
      }, 1400);
    } catch (err) {
      console.error(err);
      alert("Server error. Try again.");
    }
  });
});
