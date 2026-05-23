/**
 * FSM Service
 * In-memory CRUD operations for FSM data management.
 */

const { getDefaultFsm, validateFsmData } = require('../models/fsm');

// In-memory FSM store
let currentFsm = getDefaultFsm();

/**
 * Returns the current FSM data.
 * @returns {Object}
 */
function getFsm() {
  return JSON.parse(JSON.stringify(currentFsm));
}

/**
 * Resets the FSM to the default configuration.
 * @returns {Object} The reset FSM.
 */
function resetFsm() {
  currentFsm = getDefaultFsm();
  return getFsm();
}

/**
 * Adds a new state to the FSM.
 * @param {string} name - The state name.
 * @returns {{ success: boolean, error?: string, fsm?: Object }}
 */
function addState(name) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { success: false, error: 'State name is required' };
  }
  const trimmed = name.trim();
  if (currentFsm.states.includes(trimmed)) {
    return { success: false, error: `State "${trimmed}" already exists` };
  }
  currentFsm.states.push(trimmed);
  return { success: true, fsm: getFsm() };
}

/**
 * Removes a state and all its associated transitions.
 * @param {string} name - The state name to remove.
 * @returns {{ success: boolean, error?: string, fsm?: Object }}
 */
function removeState(name) {
  if (!name || !currentFsm.states.includes(name)) {
    return { success: false, error: `State "${name}" not found` };
  }
  currentFsm.states = currentFsm.states.filter(s => s !== name);
  currentFsm.transitions = currentFsm.transitions.filter(
    t => t.from !== name && t.to !== name
  );
  if (currentFsm.startState === name) {
    currentFsm.startState = currentFsm.states[0] || '';
  }
  return { success: true, fsm: getFsm() };
}

/**
 * Adds a new transition to the FSM.
 * @param {string} from - Source state.
 * @param {string} to - Target state.
 * @param {string} action - Transition action/label.
 * @returns {{ success: boolean, error?: string, fsm?: Object }}
 */
function addTransition(from, to, action) {
  if (!from || !to || !action) {
    return { success: false, error: 'from, to, and action are all required' };
  }
  if (!currentFsm.states.includes(from)) {
    return { success: false, error: `Source state "${from}" does not exist` };
  }
  if (!currentFsm.states.includes(to)) {
    return { success: false, error: `Target state "${to}" does not exist` };
  }
  const duplicate = currentFsm.transitions.some(
    t => t.from === from && t.to === to && t.action === action
  );
  if (duplicate) {
    return { success: false, error: 'This transition already exists' };
  }
  currentFsm.transitions.push({ from, to, action });
  return { success: true, fsm: getFsm() };
}

/**
 * Removes a transition by index.
 * @param {number} index - The index of the transition to remove.
 * @returns {{ success: boolean, error?: string, fsm?: Object }}
 */
function removeTransition(index) {
  if (typeof index !== 'number' || Number.isNaN(index) || index < 0 || index >= currentFsm.transitions.length) {
    return { success: false, error: `Invalid transition index: ${index}` };
  }
  currentFsm.transitions.splice(index, 1);
  return { success: true, fsm: getFsm() };
}

/**
 * Sets the start state of the FSM.
 * @param {string} stateName - The state to set as start.
 * @returns {{ success: boolean, error?: string, fsm?: Object }}
 */
function setStartState(stateName) {
  if (!stateName || !currentFsm.states.includes(stateName)) {
    return { success: false, error: `State "${stateName}" not found` };
  }
  currentFsm.startState = stateName;
  return { success: true, fsm: getFsm() };
}

/**
 * Imports an FSM from a JSON object, replacing the current FSM.
 * @param {Object} data - The FSM data to import.
 * @returns {{ success: boolean, error?: string, fsm?: Object }}
 */
function importFsm(data) {
  const validation = validateFsmData(data);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  currentFsm = JSON.parse(JSON.stringify(data));
  return { success: true, fsm: getFsm() };
}

module.exports = {
  getFsm,
  resetFsm,
  addState,
  removeState,
  addTransition,
  removeTransition,
  setStartState,
  importFsm
};
