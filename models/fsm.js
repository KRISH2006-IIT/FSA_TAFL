/**
 * FSM Data Model
 * Defines the structure and default configuration for a Finite State Machine.
 */

const DEFAULT_FSM = {
  states: ["MainMenu", "Settings", "LevelSelect", "Gameplay", "Pause", "GameOver"],
  startState: "MainMenu",
  transitions: [
    { from: "MainMenu", to: "Settings", action: "openSettings" },
    { from: "MainMenu", to: "LevelSelect", action: "play" },
    { from: "LevelSelect", to: "Gameplay", action: "startLevel" },
    { from: "Gameplay", to: "Pause", action: "pauseGame" },
    { from: "Pause", to: "Gameplay", action: "resume" },
    { from: "Gameplay", to: "GameOver", action: "die" },
    { from: "Settings", to: "MainMenu", action: "back" },
    { from: "LevelSelect", to: "MainMenu", action: "back" },
    { from: "Pause", to: "MainMenu", action: "quitToMenu" }
  ]
};

/**
 * Validates an FSM data object.
 * @param {Object} data - The FSM object to validate.
 * @returns {{ valid: boolean, error?: string }}
 */
function validateFsmData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'FSM data must be an object' };
  }
  if (!Array.isArray(data.states) || data.states.length === 0) {
    return { valid: false, error: 'FSM must have a non-empty states array' };
  }
  if (!data.startState || typeof data.startState !== 'string') {
    return { valid: false, error: 'FSM must have a startState string' };
  }
  if (!data.states.includes(data.startState)) {
    return { valid: false, error: `startState "${data.startState}" is not in the states array` };
  }
  if (!Array.isArray(data.transitions)) {
    return { valid: false, error: 'FSM must have a transitions array' };
  }
  for (const t of data.transitions) {
    if (!t.from || !t.to || !t.action) {
      return { valid: false, error: 'Each transition must have from, to, and action fields' };
    }
    if (!data.states.includes(t.from)) {
      return { valid: false, error: `Transition "from" state "${t.from}" is not in states` };
    }
    if (!data.states.includes(t.to)) {
      return { valid: false, error: `Transition "to" state "${t.to}" is not in states` };
    }
  }
  return { valid: true };
}

/**
 * Creates a deep copy of the default FSM.
 * @returns {Object}
 */
function getDefaultFsm() {
  return JSON.parse(JSON.stringify(DEFAULT_FSM));
}

module.exports = { DEFAULT_FSM, validateFsmData, getDefaultFsm };
