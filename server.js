/**
 * FSM Navigator — Express Server
 * Entry point for the backend. Serves the REST API and static frontend files.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fsmRoutes = require('./routes/fsmRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API Routes ─────────────────────────────────────────────
app.use('/api/fsm', fsmRoutes);

// ── Serve Frontend Static Files ────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║   FSM Navigator — Server Running         ║`);
  console.log(`  ║   http://localhost:${PORT}                  ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});
