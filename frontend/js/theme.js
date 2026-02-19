function applyTheme() {
  const storedTheme = localStorage.getItem("theme");
  const theme = !storedTheme || storedTheme === "classic" ? "academy" : storedTheme;
  if (!storedTheme || storedTheme === "classic") {
    localStorage.setItem("theme", theme);
  }
  document.body.setAttribute("data-theme", theme);
}

document.addEventListener("DOMContentLoaded", applyTheme);
