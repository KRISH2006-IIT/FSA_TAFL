/**
 * API Client Module
 * All HTTP communication with the backend REST API.
 */

const API_BASE = '/api/fsm';

/**
 * Generic fetch wrapper with error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${options.method || 'GET'} ${url}]:`, err.message);
    throw err;
  }
}

/** GET /api/fsm — Fetch the current FSM */
export async function getFsm() {
  return request('/');
}

/** POST /api/fsm/reset — Reset FSM to defaults */
export async function resetFsm() {
  return request('/reset', { method: 'POST' });
}

/** POST /api/fsm/states — Add a state */
export async function addState(name) {
  return request('/states', { method: 'POST', body: { name } });
}

/** DELETE /api/fsm/states/:name — Remove a state */
export async function removeState(name) {
  return request(`/states/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

/** POST /api/fsm/transitions — Add a transition */
export async function addTransition(from, to, action) {
  return request('/transitions', { method: 'POST', body: { from, to, action } });
}

/** DELETE /api/fsm/transitions/:index — Remove a transition */
export async function removeTransition(index) {
  return request(`/transitions/${index}`, { method: 'DELETE' });
}

/** PUT /api/fsm/start-state — Set start state */
export async function setStartState(stateName) {
  return request('/start-state', { method: 'PUT', body: { stateName } });
}

/** POST /api/fsm/analyze — Run FSM analysis */
export async function analyzeFsm() {
  return request('/analyze', { method: 'POST' });
}

/** GET /api/fsm/export — Export FSM as JSON */
export async function exportFsm() {
  return request('/export');
}

/** POST /api/fsm/import — Import FSM from JSON */
export async function importFsm(fsmData) {
  return request('/import', { method: 'POST', body: fsmData });
}
