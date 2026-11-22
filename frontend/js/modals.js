(function () {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.hidden = true;
    document.body.appendChild(overlay);

    /* ---------- helpers ---------- */

    function esc(t) {
        return String(t ?? "")
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function todayIso() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    function readFile(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = () => reject(new Error("Could not read the file."));
            r.readAsDataURL(file);
        });
    }

    function extOf(file) {
        return file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "file";
    }

    function field(label, inner) {
        return `<label class="form-field"><span>${label}</span>${inner}</label>`;
    }

    function close() {
        overlay.hidden = true;
        overlay.innerHTML = "";
    }

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !overlay.hidden) close();
    });

    /* ---------- documents section ---------- */

    function docRow() {
        return `<div class="doc-input-row">
            <input type="text" name="docName" list="doc-names" placeholder="Document name">
            <input type="file" name="docFile" accept="image/*,.pdf">
        </div>`;
    }

    function docsSection(existing, suggestions) {
        const have = existing && existing.length
            ? `<div class="existing-docs">Already uploaded: ${existing.map(d => esc(d.name)).join(", ")}</div>`
            : "";
        return `<fieldset>
            <legend>Documents (optional)</legend>
            ${have}
            <datalist id="doc-names">${suggestions.map(s => `<option value="${s}">`).join("")}</datalist>
            <div id="doc-rows">${docRow()}</div>
            <button type="button" class="modal-btn" id="add-doc-row">+ Add another document</button>
        </fieldset>`;
    }

    async function collectDocs(form) {
        const docs = [];
        for (const row of form.querySelectorAll(".doc-input-row")) {
            const name = row.querySelector("[name=docName]").value.trim();
            const file = row.querySelector("[name=docFile]").files[0];
            if (!name && !file) continue;
            if (!name || !file) throw new Error("Each document needs both a name and a file.");
            docs.push({ name, file: await readFile(file), ext: extOf(file) });
        }
        return docs;
    }

    /* ---------- generic modal ---------- */

    function openModal(title, bodyHtml, onSubmit) {
        overlay.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true">
                <h2>${title}</h2>
                <form id="modal-form" novalidate>
                    ${bodyHtml}
                    <p class="form-error" id="form-error"></p>
                    <div class="modal-actions">
                        <button type="button" class="modal-btn" id="modal-cancel">Cancel</button>
                        <button type="submit" class="modal-btn primary">Save</button>
                    </div>
                </form>
            </div>`;
        overlay.hidden = false;

        const menu = document.getElementById("add-menu");
        if (menu) menu.classList.remove("open");

        const form = overlay.querySelector("#modal-form");
        const errorBox = overlay.querySelector("#form-error");

        overlay.querySelector("#modal-cancel").addEventListener("click", close);

        const addDoc = form.querySelector("#add-doc-row");
        if (addDoc) {
            addDoc.addEventListener("click", () =>
                form.querySelector("#doc-rows").insertAdjacentHTML("beforeend", docRow()));
        }

        form.addEventListener("submit", async e => {
            e.preventDefault();
            errorBox.textContent = "";
            try {
                await onSubmit(form);
                close();
                if (typeof refreshPage === "function") refreshPage();
            } catch (err) {
                errorBox.textContent = err.message;
            }
        });

        const first = form.querySelector("input, select");
        if (first) first.focus();
    }

    /* ---------- vehicle form ---------- */

    function normaliseReg(text) {
        const compact = text.toUpperCase().replace(/[\s-]/g, "");
        const m = compact.match(/^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})$/);
        return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : null;
    }

    window.openVehicleForm = function (id) {
        const v = id ? getVehicles().find(x => x.id === id) : null;

        openModal(v ? "Edit vehicle" : "Add vehicle", `
            ${field("Vehicle name", `<input type="text" name="fullName" value="${esc(v?.name)}" placeholder="e.g. Hyundai Creta">`)}
            ${field("Registration number", `<input type="text" name="regNo" value="${esc(v?.regNo)}" placeholder="KA 01 AB 1234">`)}
            ${field("Photo (optional)", `<input type="file" name="photo" accept="image/*">`)}
            ${docsSection(v?.documents, ["RC", "Insurance", "PUC"])}
        `, async form => {
            const f = form.elements;
            const name = f.fullName.value.trim();
            const regNo = normaliseReg(f.regNo.value);

            if (!name) throw new Error("Enter the vehicle name.");
            if (!regNo) throw new Error("Registration number should look like KA 01 AB 1234.");
            if (getVehicles().some(x => x.regNo === regNo && x.id !== v?.id)) {
                throw new Error("A vehicle with this registration number already exists.");
            }

            const photoFile = f.photo.files[0];
            const photo = photoFile ? await readFile(photoFile) : (v?.photo || "");
            const docs = await collectDocs(form);

            if (v) updateVehicle(v.id, { name, regNo, photo, documents: [...v.documents, ...docs] });
            else addVehicle({ name, regNo, photo, documents: docs });
        });
    };

    /* ---------- instructor form ---------- */

    window.openInstructorForm = function (id) {
        const ins = id ? getInstructors().find(x => x.id === id) : null;
        const assigned = ins ? ins.vehicleIds : [];
        const choices = getVehicles().filter(v => v.status === "active" || assigned.includes(v.id));

        const checks = choices.length
            ? choices.map(v => `
                <label>
                    <input type="checkbox" name="vehicleIds" value="${v.id}" ${assigned.includes(v.id) ? "checked" : ""}>
                    ${esc(v.name)} (${esc(v.regNo)})
                </label>`).join("")
            : `<span class="existing-docs">No vehicles added yet.</span>`;

        openModal(ins ? "Edit instructor" : "Add instructor", `
            ${field("Instructor name", `<input type="text" name="fullName" value="${esc(ins?.name)}">`)}
            ${field("Registration / ID number", `<input type="text" name="idNo" value="${esc(ins?.idNo)}" placeholder="e.g. INS-004">`)}
            ${field("Photo (optional)", `<input type="file" name="photo" accept="image/*">`)}
            <fieldset>
                <legend>Vehicles used</legend>
                <div class="check-list">${checks}</div>
            </fieldset>
            ${docsSection(ins?.documents, ["Driving licence", "ID proof", "Certificate"])}
        `, async form => {
            const f = form.elements;
            const name = f.fullName.value.trim();
            const idNo = f.idNo.value.trim();

            if (!name) throw new Error("Enter the instructor name.");
            if (!idNo) throw new Error("Enter the registration / ID number.");
            if (getInstructors().some(x => x.idNo.toLowerCase() === idNo.toLowerCase() && x.id !== ins?.id)) {
                throw new Error("An instructor with this ID number already exists.");
            }

            const vehicleIds = [...form.querySelectorAll("input[name=vehicleIds]:checked")].map(c => Number(c.value));
            const photoFile = f.photo.files[0];
            const photo = photoFile ? await readFile(photoFile) : (ins?.photo || "");
            const docs = await collectDocs(form);

            if (ins) updateInstructor(ins.id, { name, idNo, photo, vehicleIds, documents: [...ins.documents, ...docs] });
            else addInstructor({ name, idNo, photo, vehicleIds, documents: docs });
        });
    };

    /* ---------- student form ---------- */

    const hr = h => `${h % 12 || 12} ${h < 12 ? "am" : "pm"}`;
    const SLOTS = [];
    for (let h = 9; h < 19; h++) SLOTS.push(`${hr(h)} - ${hr(h + 1)}`);

    function options(list, selected, label) {
        return list.map(x =>
            `<option value="${x.id}" ${x.id === selected ? "selected" : ""}>${esc(label(x))}</option>`
        ).join("");
    }

    window.openStudentForm = function (id) {
        const s = id ? getStudent(id) : null;
        const insList = getInstructors().filter(i => i.status === "active" || i.id === s?.instructorId);
        const vehList = getVehicles().filter(v => v.status === "active" || v.id === s?.vehicleId);

        openModal(s ? "Edit student" : "Add student", `
            ${field("Full name", `<input type="text" name="fullName" value="${esc(s?.name)}">`)}
            <div class="form-row">
                ${field("Date of birth", `<input type="date" name="dob" value="${s?.dob || ""}">`)}
                ${field("Gender", `<select name="gender">
                    <option value="">Select</option>
                    ${["Male", "Female", "Other"].map(g => `<option ${s?.gender === g ? "selected" : ""}>${g}</option>`).join("")}
                </select>`)}
            </div>
            ${field("Application / licence number", `<input type="text" name="licenseNo" value="${esc(s?.licenseNo)}">`)}
            <div class="form-row">
                ${field("Instructor", `<select name="instructorId">
                    <option value="">Select</option>
                    ${options(insList, s?.instructorId, i => i.name)}
                </select>`)}
                ${field("Vehicle", `<select name="vehicleId">
                    <option value="">Select</option>
                    ${options(vehList, s?.vehicleId, v => `${v.name} (${v.regNo})`)}
                </select>`)}
            </div>
            <div class="form-row">
                ${field("Time slot", `<select name="slot">
                    <option value="">Select</option>
                    ${SLOTS.map(t => `<option ${s?.slot === t ? "selected" : ""}>${t}</option>`).join("")}
                </select>`)}
                ${field("Enrolled on", `<input type="date" name="enrolledOn" value="${s?.enrolledOn || todayIso()}">`)}
            </div>
            <div class="form-row">
                ${field("Total sessions", `<input type="number" name="totalSessions" min="1" value="${s?.totalSessions ?? 15}">`)}
                ${field("Total fee (₹)", `<input type="number" name="totalFee" min="0" value="${s?.totalFee ?? ""}">`)}
            </div>
            ${field("Paid so far (₹)", `<input type="number" name="paidFee" min="0" value="${s?.paidFee ?? 0}">`)}
            ${docsSection(s?.documents, ["Aadhaar", "PAN", "Passport photo", "Address proof"])}
        `, async form => {
            const f = form.elements;
            const name = f.fullName.value.trim();
            const dob = f.dob.value;
            const gender = f.gender.value;
            const licenseNo = f.licenseNo.value.trim();
            const instructorId = Number(f.instructorId.value);
            const vehicleId = Number(f.vehicleId.value);
            const slot = f.slot.value;
            const enrolledOn = f.enrolledOn.value;
            const totalSessions = Number(f.totalSessions.value);
            const totalFee = Number(f.totalFee.value || 0);
            const paidFee = Number(f.paidFee.value || 0);

            if (!name) throw new Error("Enter the student's name.");
            if (!dob) throw new Error("Enter the date of birth.");
            if (dob >= todayIso()) throw new Error("Date of birth must be in the past.");
            if (!gender) throw new Error("Select a gender.");
            if (!licenseNo) throw new Error("Enter the application / licence number.");
            if (getStudents().some(x => x.licenseNo.toLowerCase() === licenseNo.toLowerCase() && x.id !== s?.id)) {
                throw new Error("A student with this application number already exists.");
            }
            if (!instructorId) throw new Error("Select an instructor.");
            if (!vehicleId) throw new Error("Select a vehicle.");
            if (!slot) throw new Error("Select a time slot.");
            if (!enrolledOn) throw new Error("Enter the enrolment date.");
            if (!Number.isInteger(totalSessions) || totalSessions < 1) throw new Error("Total sessions must be at least 1.");
            if (s && totalSessions < s.sessionsDone) throw new Error("Total sessions cannot be less than sessions already done.");
            if (totalFee < 0 || paidFee < 0) throw new Error("Fees cannot be negative.");
            if (paidFee > totalFee) throw new Error("Paid amount cannot be more than the total fee.");

            const clash = getStudents().find(o =>
                o.id !== s?.id && o.status === "active" && o.slot === slot &&
                (o.instructorId === instructorId || o.vehicleId === vehicleId));
            if (clash) {
                const what = clash.instructorId === instructorId ? "instructor" : "vehicle";
                throw new Error(`${clash.name} already has ${slot} with the same ${what}.`);
            }

            const docs = await collectDocs(form);
            const data = { name, dob, gender, licenseNo, instructorId, vehicleId, slot, enrolledOn, totalSessions, totalFee, paidFee };

            if (s) updateStudent(s.id, { ...data, documents: [...s.documents, ...docs] });
            else addStudent({ ...data, documents: docs });
        });
    };

    /* ---------- the "+ Add" dropdown (works on every page) ---------- */

    document.addEventListener("click", e => {
        const btn = e.target.closest("#add-menu button[data-action]");
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === "student") openStudentForm();
        else if (action === "instructor") openInstructorForm();
        else if (action === "vehicle") openVehicleForm();
    });
})();