const SCHOOL = {
    openHour: 9,
    closeHour: 19,
    workDays: [1, 2, 3, 4, 5, 6],
    holidays: [],
};
const PAST_DAYS = 3;
const FUTURE_DAYS = 7;
const LOAD_CHUNK = 7;

const sampleSessions = [
    { dayOffset: 1, hour: 9, entries: [{ car: 'Creta', student: 'Muzafar' }, { car: 'City', student: 'Muskan' }] },
    { dayOffset: 1, hour: 11, entries: [{ car: 'Creta', student: 'Rahul' }] },
    { dayOffset: 1, hour: 17, entries: [{ car: 'City', student: 'Ananya' }] },
    { dayOffset: 2, hour: 10, entries: [{ car: 'Creta', student: 'Kiran' }] },
    { dayOffset: 2, hour: 13, entries: [{ car: 'Creta', student: 'Muzafar' }, { car: 'City', student: 'Muskan' }] },
];

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatHour = (h) => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const root = document.getElementById('calendar');
const picker = document.getElementById('date-picker');
const todayKey = dateKey(new Date());
const sessions = buildSessionMap();
let firstDate, lastDate;

function buildSessionMap() {
    const map = {};
    const today = new Date();
    sampleSessions.forEach((s) => {
        map[`${dateKey(addDays(today, s.dayOffset))}-${s.hour}`] = s.entries;
    });
    return map;
}

function dayHtml(d) {
    const key = dateKey(d);
    const closed = !SCHOOL.workDays.includes(d.getDay()) || SCHOOL.holidays.includes(key);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const todayClass = key === todayKey ? ' today' : '';

    let html = `<section class="day" id="day-${key}">`;
    html += `<h3 class="day-title${todayClass}">${label}</h3>`;

    if (closed) {
        html += `<div class="dots"><i></i><i></i><i></i></div>`;
    } else {
        for (let h = SCHOOL.openHour; h < SCHOOL.closeHour; h++) {
            const entries = sessions[`${key}-${h}`] || [];
            const chips = entries.map((e) => `<span class="chip">${e.car}: ${e.student}</span>`).join('');
            html += `<div class="slot"><div class="slot-time">${formatHour(h)}</div><div class="slot-body">${chips}</div></div>`;
        }
    }
    return html + `</section>`;
}

function rangeHtml(start, count) {
    let html = '';
    for (let i = 0; i < count; i++) html += dayHtml(addDays(start, i));
    return html;
}

function jumpToDate(date) {
    firstDate = addDays(date, -PAST_DAYS);
    lastDate = addDays(date, FUTURE_DAYS);
    root.innerHTML = rangeHtml(firstDate, PAST_DAYS + FUTURE_DAYS + 1);
    const target = document.getElementById(`day-${dateKey(date)}`);
    root.scrollTop = target.offsetTop;
    picker.value = dateKey(date);
}

root.addEventListener('scroll', () => {
    if (root.scrollTop < 150) {
        const before = root.scrollHeight;
        const start = addDays(firstDate, -LOAD_CHUNK);
        root.insertAdjacentHTML('afterbegin', rangeHtml(start, LOAD_CHUNK));
        firstDate = start;
        root.scrollTop += root.scrollHeight - before;
    } else if (root.scrollTop + root.clientHeight > root.scrollHeight - 150) {
        root.insertAdjacentHTML('beforeend', rangeHtml(addDays(lastDate, 1), LOAD_CHUNK));
        lastDate = addDays(lastDate, LOAD_CHUNK);
    }
});

picker.addEventListener('change', () => {
    if (!picker.value) return;
    const [y, m, d] = picker.value.split('-').map(Number);
    jumpToDate(new Date(y, m - 1, d));
});

jumpToDate(new Date());