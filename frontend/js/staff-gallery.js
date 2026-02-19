
const form = document.getElementById("galleryForm");
const token = localStorage.getItem("staffToken");

form.addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(form);

  try {
    const res = await fetch("http://localhost:5000/api/staff/gallery", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) throw new Error();

    alert("Gallery item uploaded");
    form.reset();
  } catch {
    alert("Gallery upload failed");
  }
});
