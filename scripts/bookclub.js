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
    const monthlyBooks = (NINETTE_BOOK_LEVELS.monthly && NINETTE_BOOK_LEVELS.monthly.books) || [];
    const monthlyCount = monthlyBooks.filter(function (book) {
        return book.level === levelKey;
    }).length;
    const bookCount = books.length + monthlyCount;
    document.getElementById("bc-count-n").textContent = bookCount;
    document.getElementById("bc-progress-fill").style.width = bookCount + "%";
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
                const sizeClass = bookIndex % 3 === 0 ? " is-compact" : "";
                const title = escapeHtml(book.title);
                return '<figure class="bc-book' + sizeClass + '" title="' + title + '">' +
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

function ninetteRenderMonthlyBooks() {
    const monthly = NINETTE_BOOK_LEVELS.monthly;
    const container = document.getElementById("bc-monthly-books");
    if (!monthly || !container) return;

    container.innerHTML = monthly.books.map(function (book) {
        const title = escapeHtml(book.title);
        return '<figure class="bc-monthly-book" title="' + title + '">' +
            '<img decoding="async" src="' + book.src + '" alt="' + title + '"></figure>';
    }).join("");

    const books = Array.from(container.querySelectorAll(".bc-monthly-book"));

    container.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        const containerBounds = container.getBoundingClientRect();
        const pointerX = event.clientX - containerBounds.left;

        books.forEach(function (book) {
            const bounds = book.getBoundingClientRect();
            const bookCenter = bounds.left - containerBounds.left + bounds.width / 2;
            const distance = Math.abs(pointerX - bookCenter);
            const proximity = Math.max(0, 1 - distance / (bounds.width * 1.25));
            const bookStyle = getComputedStyle(book);
            const lift = bookStyle.getPropertyValue("--monthly-lift").trim();
            const tilt = bookStyle.getPropertyValue("--monthly-tilt").trim();
            const scale = (1 + proximity * .28).toFixed(3);
            const rise = Math.round(proximity * 18);
            book.style.animation = "none";
            book.style.transform = "translateY(calc(" + lift + " - " + rise + "px)) rotate(" + tilt + ") scale(" + scale + ")";
        });
    });

    container.addEventListener("pointerleave", function () {
        books.forEach(function (book) {
            book.style.removeProperty("transform");
        });
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
    ninetteRenderMonthlyBooks();
    ninetteRenderBookLevel("ages-2-5");
}

initializeBookClub().catch(function (error) {
    console.error(error);
});
