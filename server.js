/**
 * VOICEMETER PARLIAMENT SERVER v2.2
 * Project: iNFLUENSA AFRO-FUTURISTIC IP PROTOCOL
 * Target Date: April 25, 2026
 * * This server handles real-time parliamentary voting, data persistence,
 * and multi-client synchronization for the VoiceMeter interface.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs-extra');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'database', 'parliament_record.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- MIDDLEWARE ---
app.use(morgan('dev')); // High-visibility logging
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// --- STATE MANAGEMENT ---
let sessionState = {
    motion: "National Infrastructure Bill 2026",
    startTime: new Date().toISOString(),
    votes: { YES: [], NO: [], ABSTAIN: [] },
    ledger: [],
    stats: {
        totalIntensity: 0,
        confidenceScore: 0,
        activeParticipants: 0
    }
};

/**
 * DATABASE INITIALIZATION
 * Loads previous session data if it exists to prevent data loss.
 */
async function initDatabase() {
    try {
        await fs.ensureDir(path.join(__dirname, 'database'));
        const exists = await fs.pathExists(DATA_PATH);
        if (exists) {
            const savedData = await fs.readJson(DATA_PATH);
            sessionState = savedData;
            console.log('>>> Database Loaded: Previous session recovered.');
        } else {
            await fs.writeJson(DATA_PATH, sessionState);
            console.log('>>> Database Initialized: New session record created.');
        }
    } catch (err) {
        console.error('CRITICAL: Database initialization failed:', err);
    }
}

/**
 * PERSISTENCE LAYER
 * Saves current state to disk. Called after every vote.
 */
async function syncToDisk() {
    try {
        await fs.writeJson(DATA_PATH, sessionState, { spaces: 4 });
    } catch (err) {
        console.error('Error syncing to disk:', err);
    }
}

/**
 * CORE LOGIC: STATS CALCULATOR
 * Recalculates weighted confidence based on intensity.
 */
function recalculateStats() {
    const yesW = sessionState.votes.YES.reduce((s, v) => s + v.intensity, 0);
    const noW = sessionState.votes.NO.reduce((s, v) => s + v.intensity, 0);
    
    const totalWeight = yesW + noW;
    sessionState.stats.totalIntensity = yesW + noW + sessionState.votes.ABSTAIN.reduce((s, v) => s + v.intensity, 0);
    sessionState.stats.confidenceScore = totalWeight > 0 ? Math.round((yesW / totalWeight) * 100) : 0;
}

// --- SOCKET.IO REAL-TIME GATEWAY ---
io.on('connection', (socket) => {
    sessionState.stats.activeParticipants++;
    console.log(`[CONN] MP Joined: ${socket.id} | Total Online: ${sessionState.stats.activeParticipants}`);

    // Update all users on headcount
    io.emit('mp_count', sessionState.stats.activeParticipants);

    // Synchronize client with current server state
    socket.emit('init_state', {
        votes: sessionState.votes,
        ledger: sessionState.ledger,
        motion: sessionState.motion,
        stats: sessionState.stats
    });

    /**
     * EVENT: cast_vote
     * Validates and processes parliamentary votes.
     */
    socket.on('cast_vote', async (vote) => {
        // Validation Layer
        if (!vote.choice || !['YES', 'NO', 'ABSTAIN'].includes(vote.choice)) {
            return socket.emit('vote_error', { message: "Invalid voting choice." });
        }

        // Security: Ensure unique ID
        const secureVote = {
            ...vote,
            id: vote.id || uuidv4(),
            serverTimestamp: new Date().toISOString()
        };

        // Update State
        sessionState.votes[vote.choice].push(secureVote);
        sessionState.ledger.unshift(secureVote);
        
        recalculateStats();
        
        console.log(`[VOTE] ${vote.voter} (${vote.constituency}) cast ${vote.choice} [Int: ${vote.intensity}]`);

        // Broadcast to all connected MPs
        io.emit('vote_update', {
            newVote: secureVote,
            fullState: sessionState
        });

        // Persist change
        await syncToDisk();
    });

    /**
     * EVENT: disconnect
     */
    socket.on('disconnect', () => {
        sessionState.stats.activeParticipants--;
        io.emit('mp_count', sessionState.stats.activeParticipants);
        console.log(`[DISCONN] MP Left. Active: ${sessionState.stats.activeParticipants}`);
    });
});

// --- REST API ENDPOINTS ---

/**
 * GET /api/results
 * Returns the current state as a JSON object for the "Export" button.
 */
app.get('/api/results', (req, res) => {
    res.json(sessionState);
});

/**
 * POST /api/reset (Protected)
 * Clears the session for a new motion.
 */
app.post('/api/reset', async (req, res) => {
    // In production, add an API key check here
    sessionState.votes = { YES: [], NO: [], ABSTAIN: [] };
    sessionState.ledger = [];
    sessionState.stats.totalIntensity = 0;
    sessionState.stats.confidenceScore = 0;
    
    await syncToDisk();
    io.emit('init_state', sessionState);
    res.status(200).send("Session Reset Successful.");
});

/**
 * GET /health
 * For monitoring server uptime during the Triple Launch.
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'Online',
        uptime: process.uptime(),
        memory: process.memoryUsage().rss
    });
});

// --- SERVER STARTUP ---
async function startServer() {
    await initDatabase();
    
    server.listen(PORT, () => {
        console.log(`
==================================================
   VOICEMETER PARLIAMENT SERVER v2.2
   STATUS: ACTIVE
   PORT: ${PORT}
   
   LIVE AT: http://localhost:${PORT}
   PERSISTENCE: ${DATA_PATH}
==================================================
        `);
    });
}

// Global error handling for the process
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
