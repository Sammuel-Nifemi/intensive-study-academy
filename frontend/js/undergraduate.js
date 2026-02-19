// Accordion logic: only one faculty open at a time with smooth slide
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".faculty-card");

    cards.forEach(card => {
        const toggle = card.querySelector(".faculty-toggle");
        const content = card.querySelector(".faculty-content");

        toggle.addEventListener("click", () => {
            const isActive = card.classList.contains("active");

            // Close all cards
            cards.forEach(c => {
                c.classList.remove("active");
                const body = c.querySelector(".faculty-content");
                body.style.maxHeight = null;
            });

            // If previously not active, open this one
            if (!isActive) {
                card.classList.add("active");
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
});
