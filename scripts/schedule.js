const SCHEDULE_MARKS = {
    immersion: "images/sched-tree.png",
    high: "images/sched-eiffel.png",
    story: "images/sched-teddy.png",
    cp: "images/sched-openbook.png",
    elementary: "images/sched-globe.png",
    middle: "images/sched-chalk.png",
    bookclub: "images/sched-books.png"
};

function escapeScheduleHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderScheduleClass(scheduleClass) {
    const mark = SCHEDULE_MARKS[scheduleClass.type] || SCHEDULE_MARKS.bookclub;
    const level = scheduleClass.level ? '<div class="v30-level">' + escapeScheduleHtml(scheduleClass.level) + "</div>" : "";
    return '<div class="v30-card v30-' + escapeScheduleHtml(scheduleClass.type) + '">' +
        '<img class="v30-mark" src="' + mark + '" alt="" loading="lazy" decoding="async">' +
        '<div class="v30-card-content"><div class="v30-time">' + escapeScheduleHtml(scheduleClass.time) + "</div>" +
        '<div class="v30-course">' + escapeScheduleHtml(scheduleClass.course) + "</div>" + level + "</div></div>";
}

function renderSchedule(schedule) {
    const grid = document.getElementById("v30-grid");
    if (!grid) return;
    grid.innerHTML = schedule.days.map(function (day) {
        return '<section class="v30-day" aria-label="' + escapeScheduleHtml(day.name) + '">' +
            '<div class="v30-day-head">' + escapeScheduleHtml(day.name) + "</div>" +
            day.classes.map(renderScheduleClass).join("") + "</section>";
    }).join("");
}

async function initializeSchedule() {
    const response = await fetch("scripts/schedule-data.json");
    if (!response.ok) throw new Error("Could not load the weekly schedule.");
    renderSchedule(await response.json());
}

initializeSchedule().catch(function (error) {
    console.error(error);
});
