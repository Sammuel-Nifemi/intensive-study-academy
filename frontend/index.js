document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".hero-image");
  let current = 0;

  if (!slides.length) return;

  // Ensure there is always one visible slide on initial load.
  slides.forEach((slide) => slide.classList.remove("active"));
  slides[current].classList.add("active");

  if (slides.length <= 1) return;

  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 5000); // change every 5 seconds
});
