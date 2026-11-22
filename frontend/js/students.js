let currentTab = "active";
let query = "";

const listView = document.getElementById("student-list-view");
const detailView = document.getElementById("student-detail-view");
const body = document.getElementById("student-body");
const searchInput = document.getElementById("search-input");

function escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
}

function fmtDate(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function ageFrom(dob) {
    const b = new Date(dob), t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return age;
}

function money(n) {
    return "₹" + n.toLocaleString("en-IN");
}

/* ---------- list ---------- */

function rowHtml(s) {
    const actions = s.status === "active"
        ? `<button data-action="edit" data-id="${s.id}">Edit</button>
           <button data-action="delete" data-id="${s.id}">Delete</button>`
        : `<button data-action="restore" data-id="${s.id}">Restore</button>
           <button data-action="purge" data-id="${s.id}">Delete forever</button>`;

    return `
        <tr class="row" data-id="${s.id}">
            <td><div class="avatar">${escapeHtml(s.name[0])}</div></td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.stage)}</td>
            <td>${fmtDate(s.enrolledOn)}</td>
            <td><div class="row-actions">${actions}</div></td>
        </tr>`;
}

function renderList() {
    const list = getStudents().filter(s =>
        s.status === currentTab &&
        (s.name + " " + s.stage + " " + s.licenseNo).toLowerCase().includes(query)
    );
    body.innerHTML = list.length
        ? list.map(rowHtml).join("")
        : `<tr><td colspan="5" class="empty">No ${currentTab} students found.</td></tr>`;
}

document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
        currentTab = btn.dataset.tab;
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        searchInput.placeholder = `Search ${currentTab} students...`;
        renderList();
    });
});

searchInput.addEventListener("input", () => {
    query = searchInput.value.trim().toLowerCase();
    renderList();
});

body.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");

    if (btn) {
        const id = Number(btn.dataset.id);
        if (btn.dataset.action === "delete") {
            if (confirm("Move this student to Deleted?")) updateStudentStatus(id, "deleted");
        } else if (btn.dataset.action === "restore") {
            updateStudentStatus(id, "active");
        } else if (btn.dataset.action === "purge") {
            if (confirm("Delete permanently? This cannot be undone.")) removeStudent(id);
        } else if (btn.dataset.action === "edit") {
            openStudentForm(id);
        }
        renderList();
        return;
    }

    const row = e.target.closest("tr.row");
    if (row) openDetail(Number(row.dataset.id));
});

document.getElementById("add-student-btn").addEventListener("click", () => {
    openStudentForm();
});

/* ---------- detail ---------- */

function docRowHtml(s, d) {
    const downloadName = `${s.name} - ${d.name}.${d.ext}`;
    return `
        <div class="doc-row">
            <span>${escapeHtml(d.name)}</span>
            <div class="doc-links">
                <a href="${escapeHtml(d.file)}" target="_blank">View</a>
                <a href="${escapeHtml(d.file)}" download="${escapeHtml(downloadName)}">Download</a>
            </div>
        </div>`;
}

function renderDetail(id) {
    const s = getStudent(id);
    const ins = getInstructorById(s.instructorId);
    const veh = getVehicleById(s.vehicleId);
    const pending = s.totalFee - s.paidFee;
    const pct = Math.round((s.sessionsDone / s.totalSessions) * 100);

    detailView.innerHTML = `
        <button class="back-btn" id="back-btn">← Back to students</button>

        <div class="detail-header">
            <div class="avatar">${escapeHtml(s.name[0])}</div>
            <div>
                <h2>${escapeHtml(s.name)}</h2>
                <div>${escapeHtml(s.stage)}</div>
            </div>
        </div>

        <div class="detail-grid">
            <div class="panel">
                <h3>Details</h3>
                <p><span>DOB</span><span>${fmtDate(s.dob)}</span></p>
                <p><span>Age</span><span>${ageFrom(s.dob)}</span></p>
                <p><span>Gender</span><span>${escapeHtml(s.gender)}</span></p>
                <p><span>Application no.</span><span>${escapeHtml(s.licenseNo)}</span></p>
                <p><span>Enrolled on</span><span>${fmtDate(s.enrolledOn)}</span></p>
            </div>

            <div class="panel">
                <h3>Class</h3>
                <p><span>Instructor</span><span>${ins ? escapeHtml(ins.name) : "-"}</span></p>
                <p><span>Vehicle</span><span>${veh ? escapeHtml(veh.name) : "-"}</span></p>
                <p><span>Time slot</span><span>${escapeHtml(s.slot)}</span></p>
                <p><span>Progress</span><span>${s.sessionsDone} of ${s.totalSessions} sessions</span></p>
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>

            <div class="panel">
                <h3>Fees</h3>
                <p><span>Total</span><span>${money(s.totalFee)}</span></p>
                <p><span>Paid</span><span>${money(s.paidFee)}</span></p>
                <p><span>Pending</span><span class="${pending > 0 ? "pending" : ""}">${money(pending)}</span></p>
            </div>

            <div class="panel">
                <h3>Documents</h3>
                ${s.documents.length
                    ? s.documents.map(d => docRowHtml(s, d)).join("")
                    : `<p class="empty">No documents uploaded yet.</p>`}

                <div class="upload-row">
                    <input type="text" id="doc-name" list="doc-names" placeholder="Document name">
                    <datalist id="doc-names">
                        <option value="Aadhaar"><option value="PAN">
                        <option value="Passport photo"><option value="Address proof">
                    </datalist>
                    <input type="file" id="doc-file" accept="image/*,.pdf">
                    <button class="small-btn" id="upload-btn">Upload</button>
                </div>
            </div>
        </div>`;

    document.getElementById("back-btn").addEventListener("click", closeDetail);

    document.getElementById("upload-btn").addEventListener("click", () => {
    const name = document.getElementById("doc-name").value.trim();
    const file = document.getElementById("doc-file").files[0];
    if (!name || !file) {
        alert("Enter a document name and choose a file.");
        return;
    }
    const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "file";
    const reader = new FileReader();
    reader.onload = () => {
        addStudentDocument(id, { name, file: reader.result, ext });
        renderDetail(id);
    };
    reader.readAsDataURL(file);
});
}

function openDetail(id) {
    renderDetail(id);
    listView.hidden = true;
    detailView.hidden = false;
}

function closeDetail() {
    detailView.hidden = true;
    listView.hidden = false;
    renderList();
}

renderList();
function refreshPage() { renderList(); }