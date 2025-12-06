const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// State Management (In-Memory)
let currentState = {
    isActive: false,
    duration: 60, // seconds
    paragraph: "The quick brown fox jumps over the lazy dog.",
    startTime: null,
    participants: {} // socketId: { name, score, wpm, accuracy }
};

const ADMIN_PASSWORD = "admin"; // Simple password for hackathon

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // --- ADMIN EVENTS ---
    socket.on('admin-login', (password, callback) => {
        if (password === ADMIN_PASSWORD) {
            socket.join('admin');
            callback({ success: true, state: currentState });
        } else {
            callback({ success: false });
        }
    });

    socket.on('update-settings', (data) => {
        if (data.paragraph) currentState.paragraph = data.paragraph;
        if (data.duration) currentState.duration = data.duration;
        io.to('admin').emit('settings-updated', currentState);
        io.emit('text-updated', { paragraph: currentState.paragraph }); // Notify all waiting clients
    });

    socket.on('start-test', () => {
        currentState.isActive = true;
        currentState.startTime = Date.now();
        currentState.participants = {}; // Reset results
        io.emit('test-started', {
            duration: currentState.duration,
            paragraph: currentState.paragraph,
            startTime: currentState.startTime
        });
    });

    socket.on('stop-test', () => {
        currentState.isActive = false;
        io.emit('test-ended');
    });

    // --- PARTICIPANT EVENTS ---
    socket.on('join-test', (name) => {
        currentState.participants[socket.id] = { name, score: 0, wpm: 0, accuracy: 0 };
        // Send current status to new joiner
        socket.emit('init-state', {
            isActive: currentState.isActive,
            paragraph: currentState.paragraph, // Only visible if active? No, maybe preview? Let's hide it until start.
            // Actually, per requirements: "Paragraph Display Section – visible during the test"
            // So we might send empty string or handle visibility on client.
        });
    });

    socket.on('submit-result', (data) => {
        // Data contains typedText
        const { typedText, timeElapsed } = data;
        const targetText = currentState.paragraph;

        // Calculate Score
        const stats = calculateStats(targetText, typedText, timeElapsed);

        if (currentState.participants[socket.id]) {
            currentState.participants[socket.id] = {
                ...currentState.participants[socket.id],
                ...stats,
                completed: true
            };
        }

        io.to('admin').emit('results-update', currentState.participants);
        socket.emit('your-result', stats);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Optional: remove from participants or mark as offline
    });
});

function calculateStats(target, typed, timeElapsedSeconds) {
    if (!typed) typed = "";

    // Accuracy
    let correctChars = 0;
    const len = Math.min(target.length, typed.length);
    for (let i = 0; i < len; i++) {
        if (target[i] === typed[i]) correctChars++;
    }
    const accuracy = len > 0 ? (correctChars / target.length) * 100 : 0; // Based on target length for strictness? Or typed? "Correct characters ÷ Total characters" Usually Total is typed length or target length. Let's use target length for "Completeness" + Accuracy.
    // Or strictly: (Correct / Max(TargetLength, TypedLength)) * 100.
    // Allow simple version: Correct / Target.length.

    // Speed (WPM)
    // Standard: (All characters / 5) / TimeInMinutes
    const minutes = timeElapsedSeconds / 60;
    const wpm = minutes > 0 ? (typed.length / 5) / minutes : 0;

    // Final Score (Simple combination)
    const score = (wpm * 0.6) + (accuracy * 0.4);

    return {
        accuracy: accuracy.toFixed(2),
        wpm: Math.round(wpm),
        score: score.toFixed(2)
    };
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
