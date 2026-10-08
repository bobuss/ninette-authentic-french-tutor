let NINETTE_BOOK_LEVELS = {};

function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ninetteAnimateShelf() {
    const shelf = document.getElementById("bc-shelf");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let direction = 1;
    let isUserInteracting = false;

    function setUserInteraction(value) {
        isUserInteracting = value;
    }

    window.setInterval(function () {
        const overflow = shelf.scrollWidth - shelf.clientWidth;
        if (!reducedMotion.matches && !isUserInteracting && overflow > 0) {
            shelf.scrollLeft += direction;
            if (shelf.scrollLeft >= overflow) direction = -1;
            if (shelf.scrollLeft <= 0) direction = 1;
        }
    }, 50);

    window.addEventListener("pointerup", function () {
        setUserInteraction(false);
    });
    shelf.addEventListener("focusin", function () {
        setUserInteraction(true);
    });
    shelf.addEventListener("focusout", function () {
        setUserInteraction(false);
    });
}

function ninetteRenderBookLevel(levelKey) {
    const level = NINETTE_BOOK_LEVELS[levelKey];
    if (!level) return;

    const books = level.books;
    document.getElementById("bc-count-n").textContent = books.length;
    document.getElementById("bc-progress-fill").style.width = books.length + "%";
    const shelf = document.getElementById("bc-shelf");
    shelf.scrollLeft = 0;
    shelf.classList.toggle("is-empty", books.length === 0);

    if (books.length === 0) {
        shelf.innerHTML =
            '<div class="bc-empty">' +
            "<p>This level's reading list is being finalized. 🇺🇸 Contact Ninette to be notified when it launches.<br>" +
            "🇫🇷 La liste de lecture de ce niveau est en préparation. Contactez Ninette pour être informé(e) du lancement.</p>" +
            '<a href="mailto:arianesclass@gmail.com?subject=Book Club — ' + encodeURIComponent(level.label) + '">✉ Ask about this level · Se renseigner</a>' +
            "</div>";
    } else {
        shelf.innerHTML = [0, 1].map(function (rowIndex) {
            const rowBooks = books.filter(function (_, bookIndex) {
                return bookIndex % 2 === rowIndex;
            });
            return '<div class="bc-shelf-row">' + rowBooks.map(function (book, rowBookIndex) {
                const bookIndex = rowBookIndex * 2 + rowIndex;
                const isTall = bookIndex % 8 === 0;
                const isTallSpacer = rowIndex === 1 && bookIndex > 0 && (bookIndex - 1) % 8 === 0;
                const sizeClass = isTall ? " is-tall" : (bookIndex % 3 === 0 ? " is-compact" : "");
                const spacer = isTallSpacer ? '<figure class="bc-book is-spacer is-tall" aria-hidden="true"></figure>' : "";
                const title = escapeHtml(book.title);
                return spacer + '<figure class="bc-book' + sizeClass + '" title="' + title + '">' +
                    '<img loading="lazy" decoding="async" src="' + book.src.replace(/^images\//, "images/book-covers/") + '" alt="' + title + '"></figure>';
            }).join("") + "</div>";
        }).join("");

        const rows = Array.from(shelf.querySelectorAll(".bc-shelf-row"));
        const widestRow = Math.max.apply(null, rows.map(function (row) {
            return row.scrollWidth;
        }));
        rows.forEach(function (row) {
            row.style.minWidth = widestRow + "px";
        });
    }

    document.querySelectorAll(".bc-tab").forEach(function (button) {
        const active = button.dataset.level === levelKey;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
    });
}

async function initializeBookClub() {
    const response = await fetch("scripts/bookclub-data.json");
    if (!response.ok) throw new Error("Could not load the Book Club catalogue.");
    NINETTE_BOOK_LEVELS = await response.json();
    document.querySelectorAll(".bc-tab").forEach(function (button) {
        button.addEventListener("click", function () {
            ninetteRenderBookLevel(button.dataset.level);
        });
    });
    ninetteAnimateShelf();
    ninetteRenderBookLevel("ages-2-5");
}

initializeBookClub().catch(function (error) {
    console.error(error);
});
