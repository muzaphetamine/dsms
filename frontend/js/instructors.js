let currentTab = "active";
let query = "";

const grid = document.getElementById("instructor-grid");
const searchInput = document.getElementById("search-input");

function escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
}

function cardHtml(ins) {
    const photo = ins.photo
        ? `<img src="${escapeHtml(ins.photo)}" alt="${escapeHtml(ins.name)}">`
        : `<div class="photo-placeholder">No photo</div>`;

    const vehicleNames = getVehicleNamesFor(ins);
    const vehiclesLine = vehicleNames.length ? vehicleNames.join(", ") : "none assigned";

    const actions = ins.status === "active"
        ? `<button data-action="delete" data-id="${ins.id}">Delete</button>
           <button data-action="edit" data-id="${ins.id}">Edit</button>`
        : `<button data-action="restore" data-id="${ins.id}">Restore</button>
           <button data-action="purge" data-id="${ins.id}">Delete forever</button>`;

    return `
        <div class="card">
            ${photo}
            <div class="card-title">${escapeHtml(ins.name)}</div>
            <div>${escapeHtml(ins.idNo)}</div>
            <div>Vehicles: ${escapeHtml(vehiclesLine)}</div>
            <div class="card-actions">${actions}</div>
        </div>`;
}

function render() {
    const list = getInstructors().filter(ins =>
        ins.status === currentTab &&
        (ins.name + " " + ins.idNo + " " + getVehicleNamesFor(ins).join(" "))
            .toLowerCase().includes(query)
    );
    grid.innerHTML = list.length
        ? list.map(cardHtml).join("")
        : `<p class="empty">No ${currentTab} instructors found.</p>`;
}

document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
        currentTab = btn.dataset.tab;
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        searchInput.placeholder = `Search ${currentTab} instructors...`;
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
        if (confirm("Move this instructor to Deleted?")) updateInstructorStatus(id, "deleted");
    } else if (btn.dataset.action === "restore") {
        updateInstructorStatus(id, "active");
    } else if (btn.dataset.action === "purge") {
        if (confirm("Delete permanently? This cannot be undone.")) removeInstructor(id);
    } else if (btn.dataset.action === "edit") {
        openInstructorForm();
    }
    render();
});

document.getElementById("add-instructor-btn").addEventListener("click", () => {
    openInstructorForm();
});

render();
function refreshPage() { render(); }