/**
 * FSM Controller
 * Handles HTTP requests and delegates to services.
 */

const fsmService = require('../services/fsmService');
const analysisService = require('../services/analysisService');

/**
 * GET /api/fsm — Returns current FSM data.
 */
function getFsm(req, res) {
  const fsm = fsmService.getFsm();
  res.json({ success: true, fsm });
}

/**
 * POST /api/fsm/reset — Resets FSM to defaults.
 */
function resetFsm(req, res) {
  const fsm = fsmService.resetFsm();
  res.json({ success: true, fsm });
}

/**
 * POST /api/fsm/states — Adds a state.
 * Body: { name: string }
 */
function addState(req, res) {
  const { name } = req.body;
  const result = fsmService.addState(name);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json(result);
}

/**
 * DELETE /api/fsm/states/:name — Removes a state.
 */
function removeState(req, res) {
  const { name } = req.params;
  const result = fsmService.removeState(name);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json(result);
}

/**
 * POST /api/fsm/transitions — Adds a transition.
 * Body: { from: string, to: string, action: string }
 */
function addTransition(req, res) {
  const { from, to, action } = req.body;
  const result = fsmService.addTransition(from, to, action);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json(result);
}

/**
 * DELETE /api/fsm/transitions/:index — Removes a transition by index.
 */
function removeTransition(req, res) {
  const index = parseInt(req.params.index, 10);
  const result = fsmService.removeTransition(index);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json(result);
}

/**
 * PUT /api/fsm/start-state — Sets the start state.
 * Body: { stateName: string }
 */
function setStartState(req, res) {
  const { stateName } = req.body;
  const result = fsmService.setStartState(stateName);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json(result);
}

/**
 * POST /api/fsm/analyze — Runs FSM analysis.
 */
function analyzeFsm(req, res) {
  const fsm = fsmService.getFsm();
  const analysis = analysisService.analyzeFsm(fsm);
  res.json({ success: true, analysis });
}

/**
 * GET /api/fsm/export — Exports FSM as JSON.
 */
function exportFsm(req, res) {
  const fsm = fsmService.getFsm();
  res.json({ success: true, fsm });
}

/**
 * POST /api/fsm/import — Imports FSM from JSON.
 * Body: { states, startState, transitions }
 */
function importFsm(req, res) {
  const result = fsmService.importFsm(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json(result);
}

module.exports = {
  getFsm,
  resetFsm,
  addState,
  removeState,
  addTransition,
  removeTransition,
  setStartState,
  analyzeFsm,
  exportFsm,
  importFsm
};
