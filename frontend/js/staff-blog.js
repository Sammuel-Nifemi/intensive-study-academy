const form = document.getElementById("blogForm");
const token = localStorage.getItem("staffToken");

form.addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    title: form.title.value,
    content: form.content.value,
    published: form.published.checked
  };

  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/staff/blogs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error();

    alert("Blog post created");
    form.reset();
  } catch {
    alert("Failed to create blog post");
  }
});
