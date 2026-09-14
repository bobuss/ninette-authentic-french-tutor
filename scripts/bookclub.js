let NINETTE_BOOK_LEVELS = {};

function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ninetteUpdateShelfScrollbar() {
    const shelf = document.getElementById("bc-shelf");
    const scrollbar = document.getElementById("bc-scrollbar");
    const thumb = document.getElementById("bc-scroll-thumb");
    const overflow = shelf.scrollWidth - shelf.clientWidth;
    scrollbar.hidden = overflow <= 0;
    if (overflow <= 0) return;

    const trackWidth = scrollbar.clientWidth;
    const thumbWidth = Math.max(32, trackWidth * shelf.clientWidth / shelf.scrollWidth);
    const travel = trackWidth - thumbWidth;
    thumb.style.width = thumbWidth + "px";
    thumb.style.transform = "translateX(" + (travel * shelf.scrollLeft / overflow) + "px)";
}

function ninetteEnableShelfGrip() {
    const shelf = document.getElementById("bc-shelf");
    const scrollbar = document.getElementById("bc-scrollbar");
    const thumb = document.getElementById("bc-scroll-thumb");
    let dragStartX = 0;
    let dragStartScroll = 0;
    let activePointerId = null;

    shelf.addEventListener("scroll", ninetteUpdateShelfScrollbar, { passive: true });
    shelf.addEventListener("load", ninetteUpdateShelfScrollbar, true);
    window.addEventListener("resize", ninetteUpdateShelfScrollbar);
    thumb.addEventListener("pointerdown", function (event) {
        activePointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartScroll = shelf.scrollLeft;
        event.preventDefault();
    });
    window.addEventListener("pointermove", function (event) {
        if (event.pointerId !== activePointerId) return;
        const trackTravel = scrollbar.clientWidth - thumb.offsetWidth;
        const scrollTravel = shelf.scrollWidth - shelf.clientWidth;
        if (trackTravel > 0 && scrollTravel > 0) {
            shelf.scrollLeft = dragStartScroll + (event.clientX - dragStartX) * scrollTravel / trackTravel;
        }
    });
    window.addEventListener("pointerup", function (event) {
        if (event.pointerId === activePointerId) activePointerId = null;
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
                const sizeClass = isTall || isTallSpacer ? " is-tall" : (bookIndex % 3 === 0 ? " is-compact" : "");
                if (isTallSpacer) return '<figure class="bc-book is-spacer' + sizeClass + '" aria-hidden="true"></figure>';
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
    requestAnimationFrame(ninetteUpdateShelfScrollbar);
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
    ninetteEnableShelfGrip();
    ninetteRenderBookLevel("ages-2-5");
}

initializeBookClub().catch(function (error) {
    console.error(error);
});
