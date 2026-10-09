function ninetteInitializeSeasonalEffect() {
    const effect = document.body.dataset.seasonalEffect;
    const container = document.querySelector(".seasonal-effect");
    if (!container || !["autumn-leaves", "halloween"].includes(effect)) return;

    if (effect === "halloween") {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const mobile = window.matchMedia("(max-width: 700px)").matches;
        const characters = mobile
            ? [{ image: 1, type: "runner" }, { image: 5, type: "runner" }, { image: 10, type: "jump" }, { image: 14, type: "runner" }]
            : [
                { image: 1, type: "runner" }, { image: 3, type: "runner" },
                { image: 5, type: "runner" }, { image: 7, type: "jump" },
                { image: 9, type: "runner" }, { image: 11, type: "runner" },
                { image: 12, type: "jump" }, { image: 14, type: "runner" }
            ];
        const fragment = document.createDocumentFragment();

        if (!reducedMotion) {
            characters.forEach(function (character, index) {
                const image = document.createElement("img");
                image.className = "seasonal-halloween-character seasonal-halloween-" + character.type;
                image.src = "images/halloween/halloween-" + character.image + ".webp";
                image.alt = "";
                image.draggable = false;
                image.style.setProperty("--halloween-lane", (12 + (index * 13) % 76) + "vh");
                image.style.setProperty("--halloween-delay", (index * (mobile ? 2.8 : 2.2)) + "s");
                image.style.setProperty("--halloween-direction", index % 2 ? "1" : "-1");
                fragment.appendChild(image);
            });
        }

        [1, 2, 3, 4, 5, 6].forEach(function (decoration, index) {
            const image = document.createElement("img");
            image.className = "seasonal-halloween-decoration seasonal-halloween-decoration-" + index;
            image.src = "images/halloween/decors-" + decoration + ".webp";
            image.alt = "";
            image.draggable = false;
            fragment.appendChild(image);
        });

        container.appendChild(fragment);
        return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const leaves = [
        [2, 3, 12, 8, 34, .78], [14, 7, 16, 18, -28, .65], [5, 11, 14, 4, 42, .7],
        [20, 15, 19, 12, -36, .8], [9, 19, 13, 22, 30, .62], [23, 24, 17, 6, -40, .72],
        [1, 29, 18, 15, 38, .82], [18, 34, 15, 1, -32, .66], [7, 38, 20, 10, 46, .76],
        [22, 42, 14, 20, -26, .68], [11, 47, 16, 7, 35, .74], [16, 52, 13, 17, -44, .6],
        [4, 57, 19, 3, 31, .78], [13, 61, 15, 14, -38, .7], [24, 66, 18, 9, 45, .76],
        [8, 71, 14, 22, -29, .64], [19, 76, 17, 5, 40, .72], [3, 81, 13, 16, -34, .66],
        [21, 86, 20, 11, 36, .8], [6, 91, 16, 19, -42, .7], [17, 95, 14, 2, 28, .62],
        [10, 98, 18, 13, -31, .74], [12, 104, 15, 21, 43, .68], [15, 108, 19, 6, -37, .78]
    ];

    const fragment = document.createDocumentFragment();
    leaves.slice(0, mobile ? 8 : leaves.length).forEach(function ([leaf, left, duration, delay, sway, opacity]) {
        const image = document.createElement("img");
        image.className = "seasonal-leaf";
        image.src = "images/autumn-leaves/leaf-" + String(leaf).padStart(2, "0") + ".webp";
        image.alt = "";
        image.style.setProperty("--leaf-left", left + "%");
        image.style.setProperty("--leaf-size", mobile ? "clamp(34px, 10vw, 52px)" : "clamp(52px, " + (4 + leaf % 3) + "vw, 112px)");
        image.style.setProperty("--leaf-duration", duration + "s");
        image.style.setProperty("--leaf-delay", "-" + delay + "s");
        image.style.setProperty("--leaf-sway", sway / 3 + "vw");
        image.style.setProperty("--leaf-reverse-sway", -sway / 3 + "vw");
        image.style.setProperty("--leaf-opacity", opacity);
        fragment.appendChild(image);
    });
    container.appendChild(fragment);
}

ninetteInitializeSeasonalEffect();