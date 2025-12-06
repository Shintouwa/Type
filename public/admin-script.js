const socket = io();

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');

const loginBtn = document.getElementById('login-btn');
const adminPass = document.getElementById('admin-pass');

// Controls
const durationInput = document.getElementById('duration-input');
const paragraphInput = document.getElementById('admin-paragraph-input');
const updateBtn = document.getElementById('update-btn');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const testStatus = document.getElementById('test-status');

// Table
const resultsBody = document.getElementById('results-body');

// 1. Login
loginBtn.addEventListener('click', () => {
    const password = adminPass.value;
    socket.emit('admin-login', password, (response) => {
        if (response.success) {
            loginSection.classList.remove('active');
            dashboardSection.classList.add('active');
            // Load init state
            const state = response.state;
            durationInput.value = state.duration;
            paragraphInput.value = state.paragraph;
            updateStatus(state.isActive);
        } else {
            alert("Invalid Password");
        }
    });
});

// 2. Controls
updateBtn.addEventListener('click', () => {
    socket.emit('update-settings', {
        duration: parseInt(durationInput.value),
        paragraph: paragraphInput.value
    });
    alert("Settings Updated");
});

startBtn.addEventListener('click', () => {
    socket.emit('start-test');
});

stopBtn.addEventListener('click', () => {
    socket.emit('stop-test');
});

// 3. Listeners
socket.on('settings-updated', (state) => {
    durationInput.value = state.duration;
    paragraphInput.value = state.paragraph;
});

socket.on('test-started', () => {
    updateStatus(true);
});

socket.on('test-ended', () => {
    updateStatus(false);
});

socket.on('results-update', (participants) => {
    renderTable(participants);
});

// Helpers
function updateStatus(isActive) {
    if (isActive) {
        testStatus.textContent = "RUNNING";
        testStatus.style.color = "var(--success-color)";
    } else {
        testStatus.textContent = "IDLE";
        testStatus.style.color = "var(--error-color)";
    }
}

function renderTable(participants) {
    resultsBody.innerHTML = "";
    Object.values(participants).forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.name || 'Anonymous'}</td>
            <td>${p.wpm || 0}</td>
            <td>${p.accuracy || 0}%</td>
            <td>${p.score || 0}</td>
            <td>${p.completed ? 'Done' : 'Typing...'}</td>
        `;
        resultsBody.appendChild(tr);
    });
}
