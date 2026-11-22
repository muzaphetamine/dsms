const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function buildMiniCalendar(container, year, month) {
    const today = new Date();
    const first = new Date(year, month, 1);
    const title = first.toLocaleString('default', { month: 'long', year: 'numeric' });
    const blanks = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `<h4 class="mini-title">${title}</h4><div class="mini-grid">`;
    WEEKDAYS.forEach(d => (html += `<div class="mini-weekday">${d}</div>`));
    for (let i = 0; i < blanks; i++) html += `<div></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const col = (blanks + day - 1) % 7;
        const classes = ['mini-day'];
        if (col === 6) classes.push('sunday');
        const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
        if (isToday) classes.push('today');
        html += `<div class="${classes.join(' ')}">${day}</div>`;
    }

    container.innerHTML = html + `</div>`;
}

[['cal-prev', -1], ['cal-curr', 0], ['cal-next', 1]].forEach(([id, offset]) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    buildMiniCalendar(document.getElementById(id), target.getFullYear(), target.getMonth());
});