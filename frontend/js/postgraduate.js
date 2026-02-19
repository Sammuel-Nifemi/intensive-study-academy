document.addEventListener("DOMContentLoaded", () => {
  console.log("Postgraduate JS loaded");

  // ✅ THIS LINE WAS MISSING (THE REAL BUG)
  const toggles = document.querySelectorAll(".program-toggle");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const content = toggle.nextElementSibling;

      // Close all other accordions
      document.querySelectorAll(".program-content").forEach(item => {
        if (item !== content) {
          item.style.maxHeight = null;
          item.classList.remove("open");
          item.previousElementSibling.classList.remove("active");
        }
      });

      // Toggle current
      if (content.classList.contains("open")) {
        content.style.maxHeight = null;
        content.classList.remove("open");
        toggle.classList.remove("active");
      } else {
        content.classList.add("open");

        // 🔑 THIS LINE MAKES IT OPEN
        content.style.maxHeight = content.scrollHeight + "px";

        toggle.classList.add("active");
      }
    });
  });
});
