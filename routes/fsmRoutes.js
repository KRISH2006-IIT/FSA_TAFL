/**
 * FSM API Routes
 * Defines all REST endpoints for FSM operations.
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fsmController');

// FSM data
router.get('/', ctrl.getFsm);
router.post('/reset', ctrl.resetFsm);

// States
router.post('/states', ctrl.addState);
router.delete('/states/:name', ctrl.removeState);

// Transitions
router.post('/transitions', ctrl.addTransition);
router.delete('/transitions/:index', ctrl.removeTransition);

// Start state
router.put('/start-state', ctrl.setStartState);

// Analysis
router.post('/analyze', ctrl.analyzeFsm);

// Import / Export
router.get('/export', ctrl.exportFsm);
router.post('/import', ctrl.importFsm);

module.exports = router;
