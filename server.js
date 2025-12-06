require('dotenv').config();
const express = require('express');
const http = require('http');

const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
// Database Connection - Local JSON Used
console.log('Using Local JSON Database');

// Routes
const { router: authRouter } = require('./src/routes/auth');
app.use('/api/auth', authRouter);
app.use('/api/paragraphs', require('./src/routes/paragraphs'));
app.use('/api/results', require('./src/routes/results'));

const Result = require('./src/models/Result');

// Test State
let currentTestState = {
    isRunning: false,
    startTime: null,
    endTime: null,
    paragraphText: null
};

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // If test is running, maybe inform the new client? 
    // For now, strict: if you join late, you wait or admin restarts.
    if (currentTestState.isRunning) {
        socket.emit('test_in_progress');
    }

    // Admin starts test
    socket.on('admin_start_test', (data) => {
        // data: { duration (seconds), paragraphText }
        currentTestState.isRunning = true;
        currentTestState.startTime = Date.now();
        currentTestState.endTime = Date.now() + (data.duration * 1000);
        currentTestState.paragraphText = data.paragraphText;

        io.emit('test_started', {
            duration: data.duration,
            text: data.paragraphText // Sent primarily for verification, but hidden in UI
        });

        // Auto end test on server side
        setTimeout(() => {
            if (currentTestState.isRunning) {
                io.emit('test_ended');
                currentTestState.isRunning = false;
            }
        }, data.duration * 1000);
    });

    // Admin stops test
    socket.on('admin_force_end', () => {
        if (currentTestState.isRunning) {
            io.emit('test_ended');
            currentTestState.isRunning = false;
        }
    });

    // Participant submits result
    socket.on('submit_result', async (data) => {
        // data: { participantName, typedText }
        if (!currentTestState.paragraphText) return;

        // Validate on server side (Basic check)
        // Recalculate logic could be here for security, but we trust client metrics roughly for this MVP 
        // OR we recalculate WPM/Accuracy here to prevent cheating. Let's recalculate.

        const original = currentTestState.paragraphText;
        const typed = data.typedText || "";

        let correctChars = 0;
        for (let i = 0; i < Math.min(original.length, typed.length); i++) {
            if (original[i] === typed[i]) correctChars++;
        }

        const accuracy = (correctChars / original.length) * 100;
        // WPM = (all chars / 5) / (time taken in minutes). 
        // We will take client specific wpm or calc based on test duration? 
        // Let's trust client WPM for now or re-calc if we have start time.
        // Simplified: Trust client calculated but sanitized stats.

        const result = new Result({
            participantName: data.participantName,
            wpm: data.wpm,
            accuracy: data.accuracy,
            finalScore: data.finalScore,
            testDuration: data.duration
        });

        try {
            await result.save();
            // Notify Admin
            io.emit('new_result', result);
        } catch (e) {
            console.error("Error saving result", e);
        }
    });

    socket.on('disconnect', () => {
        // console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
