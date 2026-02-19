document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("announcementForm");

  if (!form) {
    console.error("Announcement form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("staffToken");

    if (!token) {
      alert("Staff not logged in");
      return;
    }

    const formData = new FormData(form);

    try {
      const res = await fetch("http://localhost:5000/api/staff/announcements", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed");
        return;
      }

      alert("Announcement created!");
      form.reset();

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });

});
