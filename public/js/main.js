const socket = io();

let participantName = '';
let isTestActive = false;
let testDuration = 0;
let timerInterval = null;
let originalText = "";

// Security: Disable Copy/Paste/Context Menu
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'u')) {
        e.preventDefault();
    }
});

function joinTest() {
    const nameInput = document.getElementById('participant-name');
    if (!nameInput.value.trim()) return alert("Please enter your name.");

    participantName = nameInput.value.trim();
    socket.emit('join_test', { name: participantName });

    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('waiting-screen').style.display = 'block';
}

socket.on('test_in_progress', () => {
    alert("A test is currently in progress. Please wait for the next one.");
});

socket.on('test_started', (data) => {
    // data: { duration, text }
    document.getElementById('waiting-screen').style.display = 'none';
    document.getElementById('active-test-screen').style.display = 'block';

    testDuration = data.duration;
    originalText = data.text;

    // Render text (Non-selectable)
    const pDisplay = document.getElementById('paragraph-text');
    pDisplay.innerHTML = originalText; // Plain text
    pDisplay.style.userSelect = 'none';

    // Reset Input
    const inputArea = document.getElementById('typing-area');
    inputArea.value = '';
    inputArea.focus();
    inputArea.disabled = false;

    isTestActive = true;
    startTimer(testDuration);
});

socket.on('test_ended', () => {
    endTest();
});

function startTimer(seconds) {
    const timerDisplay = document.getElementById('timer-display');
    let remaining = seconds;

    timerDisplay.innerText = formatTime(remaining);

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        remaining--;
        timerDisplay.innerText = formatTime(remaining);

        if (remaining <= 0) {
            clearInterval(timerInterval);
            // End handled by server or force submit here if slight delay
        }
    }, 1000);
}

function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function endTest() {
    if (!isTestActive) return;
    isTestActive = false;
    if (timerInterval) clearInterval(timerInterval);

    const inputArea = document.getElementById('typing-area');
    inputArea.disabled = true;

    calculateAndSubmit(inputArea.value);
}

function calculateAndSubmit(typedText) {
    // Scoring Logic
    // Accuracy = (Correct Characters / Total Characters in Original) * 100
    // Speed (WPM) = (Total Typed Characters / 5) / (Time in minutes) - Let's use test duration for standard WPM

    const cleanOriginal = originalText.trim();
    const cleanTyped = typedText; // Don't trim typed, whitespace matters? SRS says "Paragraph". Usually loose.

    let correctChars = 0;
    // Simple verification
    for (let i = 0; i < Math.min(cleanOriginal.length, cleanTyped.length); i++) {
        if (cleanOriginal[i] === cleanTyped[i]) {
            correctChars++;
        }
    }

    const accuracy = ((correctChars / cleanOriginal.length) * 100) || 0;

    // Standard WPM formula: (All Typed Chars / 5) / (Time Taken in min)
    // If they stop early? No, blind test usually runs full duration.
    const timeInMin = testDuration / 60;
    const grossWPM = (cleanTyped.length / 5) / timeInMin;
    const netWPM = grossWPM * (accuracy / 100); // Weighted by accuracy often used online, or just plain WPM
    // SRS: "Speed = CPM + WPM", "Final Score = weighted accuracy + speed"
    // Let's Store Net WPM.

    const finalScore = (accuracy * 0.5) + (netWPM * 0.5); // Example 50/50 weight

    const resultData = {
        participantName,
        typedText: cleanTyped,
        wpm: Math.round(netWPM),
        accuracy: Math.round(accuracy),
        finalScore: Math.round(finalScore),
        duration: testDuration
    };

    socket.emit('submit_result', resultData);

    // Show Results
    document.getElementById('active-test-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';

    document.getElementById('res-wpm').innerText = resultData.wpm;
    document.getElementById('res-acc').innerText = resultData.accuracy + '%';
    document.getElementById('res-score').innerText = resultData.finalScore;
}
