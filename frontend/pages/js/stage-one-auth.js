

document
  .getElementById("stageOneForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const matricNumber =
      document.getElementById("matricNumber").value.trim();
    const phoneNumber =
      document.getElementById("phoneNumber").value.trim();
    const email =
      document.getElementById("email").value.trim();

    const res = await fetch("/api/student/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matricNumber,
        phoneNumber,
        email
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Student not found");
      return;
    }

    // temporarily store stage-1 info
    localStorage.setItem(
      "stageOneStudent",
      JSON.stringify({
        email,
        matricNumber,
        phoneNumber
      })
    );

    // move to stage 2
    window.location.href =
      "/pages/student/complete-profile.html";
  });
