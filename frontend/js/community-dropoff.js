(function () {
  function createCommunityDropoffCard() {
    if (document.getElementById("communityDropoffCard")) return;

    const card = document.createElement("aside");
    card.id = "communityDropoffCard";
    card.className = "community-dropoff-card";
    card.setAttribute("aria-live", "polite");

    card.innerHTML = `
      <button type="button" class="community-dropoff-close" aria-label="Close">x</button>
      <h3>Join Our Community</h3>
      <p>Get updates and support while you study.</p>
      <div class="community-dropoff-actions">
        <a href="https://whatsapp.com/channel/0029VbBXGUa2phHMIT8zmV0k" target="_blank" rel="noopener noreferrer">WhatsApp Channel</a>
        <a href="https://t.me/+U-p7syJJwCE1OWY0" target="_blank" rel="noopener noreferrer">Telegram Group</a>
        <a href="https://chat.whatsapp.com/GOb45ocYfHo0IAo7YgR4Rc" target="_blank" rel="noopener noreferrer">WhatsApp Group</a>
      </div>
    `;

    document.body.appendChild(card);

    const close = card.querySelector(".community-dropoff-close");
    close?.addEventListener("click", () => {
      card.classList.remove("visible");
    });

    setTimeout(() => {
      card.classList.add("visible");
      setTimeout(() => {
        card.classList.remove("visible");
      }, 5000);
    }, 5000);
  }

  document.addEventListener("DOMContentLoaded", createCommunityDropoffCard);
})();
