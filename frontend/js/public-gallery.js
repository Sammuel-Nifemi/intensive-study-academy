const grid = document.getElementById("galleryGrid");

async function loadGallery() {
  try {
    const res = await fetch("http://localhost:5000/api/gallery");
    const items = await res.json();

    grid.innerHTML = "";

    if (!items.length) {
      grid.innerHTML = "<p>No gallery items yet.</p>";
      return;
    }

    items.forEach(item => {
      const figure = document.createElement("figure");
      figure.className = "module-card";

      figure.innerHTML = `
        <img src="${item.fileUrl}" alt="">
        <figcaption>
          <small>${item.title || ""}</small><br>
          <small>${item.description || ""}</small>
        </figcaption>
      `;

      grid.appendChild(figure);
    });
  } catch {
    grid.innerHTML = "<p>Unable to load gallery.</p>";
  }
}

loadGallery();
