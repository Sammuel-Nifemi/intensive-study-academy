document.addEventListener("DOMContentLoaded", () => {
  const loginPath = "student-login.html";
  const items = document.querySelectorAll(".resource-item");
  const loginCard = document.querySelector(".login-card");
  let hideTimerId = null;

  function hideLoginCard() {
    if (!loginCard) return;
    loginCard.classList.remove("is-visible");
  }

  function showLoginCard() {
    if (!loginCard) return;
    loginCard.classList.add("is-visible");
    if (hideTimerId) {
      clearTimeout(hideTimerId);
    }
    hideTimerId = window.setTimeout(hideLoginCard, 5000);
  }

  if (!items.length) return;

  if (loginCard) {
    loginCard.classList.add("login-popup");
    showLoginCard();
  }

  items.forEach((item) => {
    item.classList.add("locked");

    const badge = item.querySelector(".badge");
    if (badge) {
      badge.textContent = "Locked";
    }

    item.setAttribute("href", loginPath);

    item.addEventListener("click", (event) => {
      event.preventDefault();
      showLoginCard();
      window.location.href = loginPath;
    });
  });
});
