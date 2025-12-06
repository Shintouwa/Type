const socket = io();

// DOM Elements
const joinSection = document.getElementById('join-section');
const waitingSection = document.getElementById('waiting-section');
const testSection = document.getElementById('test-section');
const resultSection = document.getElementById('result-section');

const usernameInput = document.getElementById('username');
const joinBtn = document.getElementById('join-btn');
const timerEl = document.getElementById('timer');
const paragraphDisplay = document.getElementById('paragraph-display');
const typingArea = document.getElementById('typing-area');

// Results
const resWpm = document.getElementById('res-wpm');
const resAcc = document.getElementById('res-acc');
const resScore = document.getElementById('res-score');

let testTimer = null;
let testStartTime = null;

// Navigation Helper
function showSection(sectionId) {
    [joinSection, waitingSection, testSection, resultSection].forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// 1. Join Logic
joinBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (name) {
        socket.emit('join-test', name);
        showSection('waiting-section');
    }
});

// 2. Socket Listeners
socket.on('init-state', (state) => {
    // If test is already active, maybe join as spectator or late?
    // For simplicity, just show waiting.
    if (state.isActive) {
        alert("A test is currently in progress. You will join the next round.");
    }
});

socket.on('test-started', (data) => {
    const { duration, paragraph, startTime } = data;

    // Reset UI
    paragraphDisplay.textContent = paragraph;
    typingArea.value = "";
    typingArea.disabled = false;
    typingArea.focus();

    showSection('test-section');
    startTimer(duration, startTime);
});

socket.on('test-ended', () => {
    submitTest();
});

socket.on('your-result', (stats) => {
    resWpm.textContent = stats.wpm;
    resAcc.textContent = stats.accuracy + '%';
    resScore.textContent = stats.score;
    showSection('result-section');
});

// 3. Timer Logic
function startTimer(duration, startTime) {
    if (testTimer) clearInterval(testTimer);

    // Calculate remaining time in case of clock skew or reload
    const update = () => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const remaining = Math.max(0, duration - elapsed);

        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);

        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
            clearInterval(testTimer);
            submitTest(); // Client-side fallback
        }
    };

    update();
    testTimer = setInterval(update, 100);
}

// 4. Test Logic
function submitTest() {
    if (testTimer) clearInterval(testTimer);

    // Only submit if we are in the test section
    if (testSection.classList.contains('active')) {
        const typedText = typingArea.value;
        // Estimate time? Or server handles it. We send what we have.
        // We'll calculate roughly how long simple.
        // Better: let server use test duration or start time.
        socket.emit('submit-result', {
            typedText: typedText,
            timeElapsed: 60 // This should ideally be dynamic or server controlled
        });

        typingArea.disabled = true;
    }
}

// Disable Paste
typingArea.addEventListener('paste', (e) => {
    e.preventDefault();
    alert("No pasting allowed! Type it out.");
});
