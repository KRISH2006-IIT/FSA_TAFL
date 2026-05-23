/**
 * Simulation Module
 * Manages FSM simulation state: start, step, stop, and trace tracking.
 */

const simState = {
  active: false,
  current: null,
  trace: []
};

/**
 * Returns the current simulation state.
 */
export function getSimState() {
  return { ...simState, trace: [...simState.trace] };
}

/**
 * Checks if simulation is currently active.
 */
export function isSimActive() {
  return simState.active;
}

/**
 * Starts a new simulation from the given start state.
 * @param {string} startState
 */
export function startSimulation(startState) {
  simState.active = true;
  simState.current = startState;
  simState.trace = ['Start → ' + startState];
}

/**
 * Advances the simulation by one step.
 * @param {string} toState - The state to transition to.
 * @param {string} action - The transition action label.
 */
export function stepSimulation(toState, action) {
  const from = simState.current;
  simState.trace.push(`${from} --[${action}]--> ${toState}`);
  simState.current = toState;
}

/**
 * Returns the current state name in the simulation.
 */
export function getCurrentState() {
  return simState.current;
}

/**
 * Stops the simulation and resets state.
 */
export function stopSimulation() {
  simState.active = false;
  simState.current = null;
  simState.trace = [];
}
