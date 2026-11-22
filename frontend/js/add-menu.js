const addBtn = document.getElementById('add-btn');
const addMenu = document.getElementById('add-menu');

addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    addMenu.classList.toggle('open');
});

document.addEventListener('click', () => addMenu.classList.remove('open'));

addMenu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    addMenu.classList.remove('open');
    console.log('Open form for:', action);
});