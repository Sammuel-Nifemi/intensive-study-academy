const galleryGrid = document.getElementById("galleryGrid");

async function loadGallery() {
  try {
    const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/gallery");
    const items = await res.json();

    galleryGrid.innerHTML = "";

    if (items.length === 0) {
      galleryGrid.innerHTML = "<p>No images yet.</p>";
      return;
    }

    items.forEach(item => {
      const div = document.createElement("div");
      div.innerHTML = `
        <img src="${item.imageUrl}" alt="" style="max-width:200px" />
        <p>${item.caption || ""}</p>
      `;
      galleryGrid.appendChild(div);
    });
  } catch (err) {
    galleryGrid.innerHTML = "<p>Error loading gallery.</p>";
  }
}

loadGallery();
