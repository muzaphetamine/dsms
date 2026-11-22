let currentTab = "active";
let query = "";

const grid = document.getElementById("vehicle-grid");
const searchInput = document.getElementById("search-input");

function escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
}

function cardHtml(v) {
    const photo = v.photo
        ? `<img src="${escapeHtml(v.photo)}" alt="${escapeHtml(v.name)}">`
        : `<div class="photo-placeholder">No photo</div>`;

    const actions = v.status === "active"
        ? `<button data-action="delete" data-id="${v.id}">Delete</button>
           <button data-action="edit" data-id="${v.id}">Edit</button>`
        : `<button data-action="restore" data-id="${v.id}">Restore</button>
           <button data-action="purge" data-id="${v.id}">Delete forever</button>`;

    return `
        <div class="card">
            ${photo}
            <div class="card-title">${escapeHtml(v.name)}</div>
            <div>${escapeHtml(v.regNo)}</div>
            <div class="card-actions">${actions}</div>
        </div>`;
}

function render() {
    const list = getVehicles().filter(v =>
        v.status === currentTab &&
        (v.name + " " + v.regNo).toLowerCase().includes(query)
    );
    grid.innerHTML = list.length
        ? list.map(cardHtml).join("")
        : `<p class="empty">No ${currentTab} vehicles found.</p>`;
}

document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
        currentTab = btn.dataset.tab;
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        searchInput.placeholder = `Search ${currentTab} vehicles...`;
        render();
    });
});

searchInput.addEventListener("input", () => {
    query = searchInput.value.trim().toLowerCase();
    render();
});

grid.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.dataset.action === "delete") {
        if (confirm("Move this vehicle to Deleted?")) updateVehicleStatus(id, "deleted");
    } else if (btn.dataset.action === "restore") {
        updateVehicleStatus(id, "active");
    } else if (btn.dataset.action === "purge") {
        if (confirm("Delete permanently? This cannot be undone.")) removeVehicle(id);
    } else if (btn.dataset.action === "edit") {
        openVehicleForm(id);
    }
    render();
});

document.getElementById("add-vehicle-btn").addEventListener("click", () => {
    openVehicleForm();
});

render();
function refreshPage() { render(); }