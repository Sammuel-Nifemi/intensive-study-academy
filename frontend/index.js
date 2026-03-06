document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".hero-image");
  let current = 0;
  const openBtn = document.getElementById("mobileMenuOpenBtn");
  const closeBtn = document.getElementById("mobileMenuCloseBtn");
  const mobileNav = document.getElementById("mobileNav");
  const overlay = document.getElementById("mobileNavOverlay");

  const closeMobileMenu = () => {
    if (!mobileNav || !overlay || !openBtn) return;
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("aria-hidden", "true");
    overlay.classList.remove("active");
    openBtn.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      if (!overlay.classList.contains("active")) {
        overlay.hidden = true;
      }
    }, 260);
  };

  const openMobileMenu = () => {
    if (!mobileNav || !overlay || !openBtn) return;
    overlay.hidden = false;
    requestAnimationFrame(() => {
      mobileNav.classList.add("open");
      mobileNav.setAttribute("aria-hidden", "false");
      overlay.classList.add("active");
      openBtn.setAttribute("aria-expanded", "true");
    });
  };

  openBtn?.addEventListener("click", openMobileMenu);
  closeBtn?.addEventListener("click", closeMobileMenu);
  overlay?.addEventListener("click", closeMobileMenu);
  mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      closeMobileMenu();
    }
  });

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
