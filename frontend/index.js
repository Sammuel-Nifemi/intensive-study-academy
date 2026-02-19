



const token = localStorage.getItem("studentToken");

if (token) {
  // user is logged in → redirect
  window.location.href = "/frontend/pages/student-dashboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".hero-image");
  let current = 0;

  if (slides.length <= 1) return;

  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 5000); // change every 5 seconds
});
