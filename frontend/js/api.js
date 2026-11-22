const STORAGE_KEY = "dsms-data-v1";

(function loadSaved() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!saved) return;
        vehicles.splice(0, vehicles.length, ...saved.vehicles);
        instructors.splice(0, instructors.length, ...saved.instructors);
        students.splice(0, students.length, ...saved.students);
    } catch (e) {
        console.warn("Could not load saved data, using sample data.", e);
    }
})();

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ vehicles, instructors, students }));
    } catch (e) {
        alert("Browser storage is full, so the latest change was not saved. Try smaller photos or documents.");
    }
}

function resetData() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
}
function getVehicles() {
    return vehicles;
}

function updateVehicleStatus(id, status) {
    const v = vehicles.find(v => v.id === id);
    if (v) v.status = status;
}

function removeVehicle(id) {
    const i = vehicles.findIndex(v => v.id === id);
    if (i !== -1) vehicles.splice(i, 1);
}
function getInstructors() {
    return instructors;
}

function getVehicleNamesFor(instructor) {
    return instructor.vehicleIds
        .map(id => getVehicles().find(v => v.id === id))
        .filter(Boolean)
        .map(v => v.name);
}

function updateInstructorStatus(id, status) {
    const i = instructors.find(i => i.id === id);
    if (i) i.status = status;
}

function removeInstructor(id) {
    const i = instructors.findIndex(i => i.id === id);
    if (i !== -1) instructors.splice(i, 1);
}
function getStudents() {
    return students;
}

function getStudent(id) {
    return students.find(s => s.id === id);
}

function getInstructorById(id) {
    return instructors.find(i => i.id === id);
}

function getVehicleById(id) {
    return vehicles.find(v => v.id === id);
}

function updateStudentStatus(id, status) {
    const s = getStudent(id);
    if (s) s.status = status;
}

function removeStudent(id) {
    const i = students.findIndex(s => s.id === id);
    if (i !== -1) students.splice(i, 1);
}

function addStudentDocument(studentId, doc) {
    const s = getStudent(studentId);
    if (s) s.documents.push(doc);
}
function nextId(list) {
    return list.reduce((max, x) => Math.max(max, x.id), 0) + 1;
}

function addVehicle(data) {
    const v = { id: nextId(vehicles), status: "active", photo: "", documents: [], ...data };
    vehicles.push(v);
    return v;
}
function updateVehicle(id, changes) {
    Object.assign(vehicles.find(v => v.id === id), changes);
}

function addInstructor(data) {
    const i = { id: nextId(instructors), status: "active", photo: "", vehicleIds: [], documents: [], ...data };
    instructors.push(i);
    return i;
}
function updateInstructor(id, changes) {
    Object.assign(instructors.find(i => i.id === id), changes);
}

function addStudent(data) {
    const s = { id: nextId(students), status: "active", stage: "Learning", sessionsDone: 0, documents: [], ...data };
    students.push(s);
    return s;
}
function updateStudent(id, changes) {
    Object.assign(students.find(s => s.id === id), changes);
}
[
    "updateVehicleStatus", "removeVehicle", "addVehicle", "updateVehicle",
    "updateInstructorStatus", "removeInstructor", "addInstructor", "updateInstructor",
    "updateStudentStatus", "removeStudent", "addStudent", "updateStudent",
    "addStudentDocument"
].forEach(name => {
    const original = window[name];
    window[name] = (...args) => {
        const result = original(...args);
        saveData();
        return result;
    };
});