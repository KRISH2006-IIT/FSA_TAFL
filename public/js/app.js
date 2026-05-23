/**
 * App Module — Main Orchestrator
 * Initializes the application, wires UI controls to API calls,
 * and coordinates between graph renderer, simulation, and API.
 */

import * as api from './api.js';
import * as graph from './graph.js';
import * as sim from './simulation.js';

let fsm = null;
let analysisResult = null;

/* ═══════════════════════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════════════════════ */

async function init() {
  try {
    const data = await api.getFsm();
    fsm = data.fsm;
    analysisResult = null;
    sim.stopSimulation();
    graph.resetNodePositions();
    graph.layoutNodes(fsm.states);
    graph.initToolbar();
    buildControls();
    
    // Wire up view tab switcher buttons
    const tabG = document.getElementById('tab-graph');
    const tabM = document.getElementById('tab-matrix');
    if (tabG && tabM) {
      tabG.onclick = () => switchTab('graph');
      tabM.onclick = () => switchTab('matrix');
    }
    
    render();
  } catch (err) {
    console.error('Failed to initialize:', err);
    alert(`Could not connect to the backend server. Make sure it is running on port ${window.location.port || '5000'}.`);
  }
}

function render() {
  graph.renderGraph(fsm, analysisResult, sim.getSimState());
  renderAnalysis();
  renderMatrixTable();
}

/* ═══════════════════════════════════════════════════════════
   TAB SWITCHING & TRANSITION MATRIX
   ═══════════════════════════════════════════════════════════ */

function switchTab(view) {
  const tabG = document.getElementById('tab-graph');
  const tabM = document.getElementById('tab-matrix');
  const canvasC = document.getElementById('canvas-container');
  const matrixC = document.getElementById('matrix-container');

  if (!tabG || !tabM || !canvasC || !matrixC) return;

  if (view === 'graph') {
    tabG.classList.add('active');
    tabM.classList.remove('active');
    canvasC.classList.remove('hidden');
    matrixC.classList.add('hidden');
  } else {
    tabG.classList.remove('active');
    tabM.classList.add('active');
    canvasC.classList.add('hidden');
    matrixC.classList.remove('hidden');
    renderMatrixTable();
  }
}

function renderMatrixTable() {
  const container = document.getElementById('matrix-view');
  if (!container) return;
  if (!fsm || !fsm.states.length) {
    container.innerHTML = '<p style="color:var(--text-muted)">No states to display.</p>';
    return;
  }

  // Get all unique actions in the FSM transitions
  const actions = [...new Set(fsm.transitions.map(t => t.action))].sort();

  let html = `
    <div class="matrix-card">
      <h3>Transition Matrix (State Table)</h3>
      <p>Automata representation mapping: δ(State, Action) → Target State</p>
      <div class="matrix-table-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>State (Q)</th>
  `;
  
  if (actions.length === 0) {
    html += `<th>No Transitions Defined</th>`;
  } else {
    actions.forEach(act => {
      html += `<th>${act}</th>`;
    });
  }
  
  html += `
            </tr>
          </thead>
          <tbody>
  `;

  fsm.states.forEach(state => {
    html += `
      <tr>
        <td class="state-header">${state} ${state === fsm.startState ? '<span style="color:var(--accent);font-size:0.65rem">[Start]</span>' : ''}</td>
    `;
    
    if (actions.length === 0) {
      html += `<td class="matrix-cell-empty">-</td>`;
    } else {
      actions.forEach(act => {
        const trans = fsm.transitions.find(t => t.from === state && t.action === act);
        if (trans) {
          html += `<td class="matrix-cell-target">${trans.to}</td>`;
        } else {
          html += `<td class="matrix-cell-empty">-</td>`;
        }
      });
    }
    html += `</tr>`;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/* ═══════════════════════════════════════════════════════════
   PATH SOLVER BFS ALGORITHM
   ═══════════════════════════════════════════════════════════ */

function findShortestPath(start, target) {
  if (!start || !target || !fsm.states.includes(start) || !fsm.states.includes(target)) {
    return null;
  }
  if (start === target) {
    return [];
  }

  const queue = [[start, []]]; // [currentState, pathOfTransitions]
  const visited = new Set([start]);

  while (queue.length > 0) {
    const [current, path] = queue.shift();

    if (current === target) {
      return path;
    }

    const outgoingTrans = fsm.transitions.filter(t => t.from === current);
    for (const trans of outgoingTrans) {
      if (!visited.has(trans.to)) {
        visited.add(trans.to);
        queue.push([trans.to, [...path, trans]]);
      }
    }
  }

  return null;
}

let isAnimatingPath = false;
async function animateSolvedPath(pathSteps) {
  if (isAnimatingPath || !pathSteps || pathSteps.length === 0) return;
  isAnimatingPath = true;
  
  switchTab('graph');

  for (const step of pathSteps) {
    await new Promise(resolve => {
      graph.animateEdge(step.from, step.to, () => {
        resolve();
      });
    });
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  isAnimatingPath = false;
}

/* ═══════════════════════════════════════════════════════════
   BUILDER CONTROLS
   ═══════════════════════════════════════════════════════════ */

function buildControls() {
  const lp = document.getElementById('builder-controls');
  lp.innerHTML = `
    <div class="ctrl-group">
      <label>Add State</label>
      <div class="ctrl-row">
        <input type="text" id="inp-state" placeholder="StateName">
        <button id="btn-add-state"><i data-lucide="plus"></i>Add</button>
      </div>
    </div>
    
    <div class="ctrl-group">
      <label>Remove State</label>
      <div class="ctrl-row">
        <select id="sel-rm-state"></select>
        <button id="btn-rm-state" class="danger"><i data-lucide="trash-2"></i>Delete</button>
      </div>
    </div>
    
    <div class="ctrl-group">
      <label>Add Transition</label>
      <select id="sel-from" style="margin-bottom:6px"></select>
      <select id="sel-to" style="margin-bottom:6px"></select>
      <div class="ctrl-row">
        <input type="text" id="inp-action" placeholder="actionName">
        <button id="btn-add-trans"><i data-lucide="plus"></i>Link</button>
      </div>
    </div>
    
    <div class="ctrl-group">
      <label>Remove Transition</label>
      <div class="ctrl-row">
        <select id="sel-rm-trans" style="font-size:.72rem"></select>
        <button id="btn-rm-trans" class="danger"><i data-lucide="trash-2"></i>Rm</button>
      </div>
    </div>
    
    <div class="ctrl-group">
      <label>Start State</label>
      <div class="ctrl-row">
        <select id="sel-start"></select>
        <button id="btn-set-start"><i data-lucide="flag"></i>Set</button>
      </div>
    </div>
    
    <button class="primary full" id="btn-analyze"><i data-lucide="settings"></i>Analyze FSM</button>
    <button class="full" id="btn-simulate" style="margin-top:8px"><i data-lucide="play"></i>Simulate FSM</button>
    <button class="full" id="btn-export" style="margin-top:8px"><i data-lucide="download"></i>Export JSON</button>
    
    <div class="ctrl-group" style="margin-top:14px">
      <label>Import JSON</label>
      <textarea id="ta-import" placeholder='Paste JSON here...'></textarea>
      <button class="full" id="btn-import"><i data-lucide="upload"></i>Load JSON</button>
    </div>
    
    <button class="danger full" id="btn-reset" style="margin-top:12px"><i data-lucide="rotate-ccw"></i>Reset Canvas</button>
  `;
  populateSelects();

  if (window.lucide) {
    window.lucide.createIcons();
  }

  document.getElementById('btn-add-state').onclick = handleAddState;
  document.getElementById('btn-rm-state').onclick = handleRemoveState;
  document.getElementById('btn-add-trans').onclick = handleAddTransition;
  document.getElementById('btn-rm-trans').onclick = handleRemoveTransition;
  document.getElementById('btn-set-start').onclick = handleSetStart;
  document.getElementById('btn-analyze').onclick = handleAnalyze;
  document.getElementById('btn-simulate').onclick = handleToggleSimulation;
  document.getElementById('btn-export').onclick = handleExport;
  document.getElementById('btn-import').onclick = handleImport;
  document.getElementById('btn-reset').onclick = () => init();
}

function populateSelects() {
  const opts = fsm.states.map(s => `<option value="${s}">${s}</option>`).join('');
  ['sel-rm-state', 'sel-from', 'sel-to', 'sel-start'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
  const sel = document.getElementById('sel-start');
  if (sel) sel.value = fsm.startState;

  const tOpts = fsm.transitions.map((t, i) =>
    `<option value="${i}">${t.from}→${t.to} [${t.action}]</option>`
  ).join('');
  const rt = document.getElementById('sel-rm-trans');
  if (rt) rt.innerHTML = tOpts;
}

/* ═══════════════════════════════════════════════════════════
   EVENT HANDLERS — Each calls the backend API
   ═══════════════════════════════════════════════════════════ */

async function handleAddState() {
  const inp = document.getElementById('inp-state');
  const name = inp.value.trim();
  if (!name) return;
  try {
    const data = await api.addState(name);
    fsm = data.fsm;
    graph.addNodePosition(name);
    inp.value = '';
    populateSelects();
    render();
  } catch (err) { alert(err.message); }
}

async function handleRemoveState() {
  const s = document.getElementById('sel-rm-state').value;
  if (!s) return;
  try {
    const data = await api.removeState(s);
    fsm = data.fsm;
    graph.removeNodePosition(s);
    populateSelects();
    render();
  } catch (err) { alert(err.message); }
}

async function handleAddTransition() {
  const from = document.getElementById('sel-from').value;
  const to = document.getElementById('sel-to').value;
  const action = document.getElementById('inp-action').value.trim();
  if (!from || !to || !action) return;
  try {
    const data = await api.addTransition(from, to, action);
    fsm = data.fsm;
    document.getElementById('inp-action').value = '';
    populateSelects();
    render();
  } catch (err) { alert(err.message); }
}

async function handleRemoveTransition() {
  const idx = parseInt(document.getElementById('sel-rm-trans').value);
  if (isNaN(idx)) return;
  try {
    const data = await api.removeTransition(idx);
    fsm = data.fsm;
    populateSelects();
    render();
  } catch (err) { alert(err.message); }
}

async function handleSetStart() {
  const stateName = document.getElementById('sel-start').value;
  try {
    const data = await api.setStartState(stateName);
    fsm = data.fsm;
    render();
  } catch (err) { alert(err.message); }
}

async function handleAnalyze() {
  try {
    const data = await api.analyzeFsm();
    analysisResult = data.analysis;
    render();
  } catch (err) { alert(err.message); }
}

function handleToggleSimulation() {
  if (sim.isSimActive()) {
    sim.stopSimulation();
    render();
    return;
  }
  if (!fsm.startState) { alert('Set a start state first'); return; }
  // Run analysis first, then start simulation
  handleAnalyze().then(() => {
    sim.startSimulation(fsm.startState);
    render();
  });
}

async function handleExport() {
  try {
    const data = await api.exportFsm();
    document.getElementById('modal-content').textContent = JSON.stringify(data.fsm, null, 2);
    document.getElementById('modal-overlay').classList.remove('hidden');
  } catch (err) { alert(err.message); }
}

async function handleImport() {
  try {
    const raw = document.getElementById('ta-import').value;
    const parsed = JSON.parse(raw);
    const data = await api.importFsm(parsed);
    fsm = data.fsm;
    graph.resetNodePositions();
    graph.layoutNodes(fsm.states);
    analysisResult = null;
    populateSelects();
    render();
  } catch (err) { alert('Import failed: ' + err.message); }
}

/* ═══════════════════════════════════════════════════════════
   SIMULATION STEP (called from analysis panel buttons)
   ═══════════════════════════════════════════════════════════ */

window._simStep = function (to, action) {
  const from = sim.getCurrentState();
  graph.animateEdge(from, to, () => {
    sim.stepSimulation(to, action);
    render();
  });
};

window._stopSim = function () {
  sim.stopSimulation();
  render();
};

/* ═══════════════════════════════════════════════════════════
   ANALYSIS PANEL RENDERING
   ═══════════════════════════════════════════════════════════ */

function renderAnalysis() {
  const out = document.getElementById('analysis-output');
  if (!analysisResult) {
    out.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;color:var(--text-muted);font-size:.8rem;padding:12px;background:rgba(255,255,255,0.02);border:1px dashed var(--border);border-radius:6px">
        <i data-lucide="info" style="width:16px;height:16px;color:var(--cyan)"></i>
        <span>Click "Analyze FSM" to run diagnostics.</span>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  const r = analysisResult;
  let html = `<div class="badge ${r.valid ? 'valid' : 'invalid'}">
    <i data-lucide="${r.valid ? 'check-circle' : 'alert-circle'}"></i>
    <span>${r.valid ? 'FSM Valid' : 'FSM Invalid'}</span>
  </div>`;
  html += `<div class="result-section"><h3>Dead-End States</h3><span class="count">${r.deadEnds.length} found</span><div class="chip-list">${r.deadEnds.map(s => `<span class="chip dead">${s}</span>`).join('') || '<span class="chip ok">None</span>'}</div></div>`;
  html += `<div class="result-section"><h3>Unreachable States</h3><span class="count">${r.unreachable.length} found</span><div class="chip-list">${r.unreachable.map(s => `<span class="chip unreachable">${s}</span>`).join('') || '<span class="chip ok">None</span>'}</div></div>`;

  const simState = sim.getSimState();
  if (simState.active) {
    html += `<div class="result-section">
      <h3>Simulation Active</h3>
      <p style="font-size:.82rem;font-family:var(--font-mono);margin-bottom:6px">Current: <span style="color:var(--cyan);font-weight:600">${simState.current}</span></p>`;
    const trans = fsm.transitions.filter(t => t.from === simState.current);
    if (trans.length) {
      html += `<div class="sim-actions">${trans.map(t => `<button onclick="window._simStep('${t.to}','${t.action}')">${t.action} → ${t.to}</button>`).join('')}</div>`;
    } else {
      html += `<div class="stuck-warn"><i data-lucide="alert-octagon" style="width:16px;height:16px"></i>STUCK — No transitions available</div>`;
    }
    html += `<div class="sim-trace">${simState.trace.map(s => `<div class="step">${s}</div>`).join('')}</div>`;
    html += `<button class="danger full" onclick="window._stopSim()" style="margin-top:10px"><i data-lucide="square"></i>Stop Simulation</button></div>`;
  }
  
  // Add Interactive Path Solver UI Component
  html += `
    <div class="result-section path-solver-card">
      <h3>UI Path Solver</h3>
      <span class="count">Find transition route between states</span>
      <div class="solver-inputs">
        <select id="path-start-select" style="font-size:0.75rem"></select>
        <select id="path-target-select" style="font-size:0.75rem"></select>
      </div>
      <button class="full primary" id="btn-find-path" style="margin-top:6px"><i data-lucide="navigation"></i>Find Path</button>
      <div id="path-solver-output" class="hidden"></div>
    </div>
  `;
  
  out.innerHTML = html;
  
  // Populate dropdowns & Wire Solver
  const startSelect = document.getElementById('path-start-select');
  const targetSelect = document.getElementById('path-target-select');
  if (startSelect && targetSelect) {
    const stateOptions = fsm.states.map(s => `<option value="${s}">${s}</option>`).join('');
    startSelect.innerHTML = stateOptions;
    targetSelect.innerHTML = stateOptions;
    
    // Choose sensible default target state
    startSelect.value = fsm.startState;
    if (fsm.states.includes('GameOver')) {
      targetSelect.value = 'GameOver';
    } else if (fsm.states.includes('Gameplay')) {
      targetSelect.value = 'Gameplay';
    } else if (fsm.states.length > 1) {
      targetSelect.value = fsm.states[1];
    }
    
    document.getElementById('btn-find-path').onclick = () => {
      const from = startSelect.value;
      const to = targetSelect.value;
      const path = findShortestPath(from, to);
      const resultsDiv = document.getElementById('path-solver-output');
      resultsDiv.classList.remove('hidden');
      
      if (path === null) {
        resultsDiv.innerHTML = `
          <div class="solver-results">
            <div class="solver-no-path">
              <i data-lucide="x-circle" style="width:14px;height:14px"></i>
              <span>No route exists.</span>
            </div>
          </div>
        `;
      } else if (path.length === 0) {
        resultsDiv.innerHTML = `
          <div class="solver-results">
            <div style="font-size:0.75rem;color:var(--valid)">Already at state "${from}".</div>
          </div>
        `;
      } else {
        let pathHtml = `
          <div class="solver-results">
            <h4 style="margin-bottom:8px">Route Found (${path.length} step${path.length > 1 ? 's' : ''})</h4>
            <div class="solver-path-display">
        `;
        path.forEach((step, idx) => {
          pathHtml += `
            <div class="solver-step">
              <span>${idx + 1}. ${step.from} → ${step.to}</span>
              <span class="solver-step-action">${step.action}</span>
            </div>
          `;
        });
        pathHtml += `
            </div>
            <button class="path-trace-btn" id="btn-trace-path"><i data-lucide="sparkles"></i>Trace on Graph</button>
          </div>
        `;
        resultsDiv.innerHTML = pathHtml;
        
        document.getElementById('btn-trace-path').onclick = () => {
          animateSolvedPath(path);
        };
      }
      if (window.lucide) window.lucide.createIcons();
    };
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* ═══════════════════════════════════════════════════════════
   MODAL HANDLERS
   ═══════════════════════════════════════════════════════════ */

document.getElementById('modal-close').onclick = () =>
  document.getElementById('modal-overlay').classList.add('hidden');

document.getElementById('modal-copy').onclick = () => {
  navigator.clipboard.writeText(document.getElementById('modal-content').textContent);
  document.getElementById('modal-copy').textContent = 'Copied!';
  setTimeout(() => document.getElementById('modal-copy').textContent = 'Copy to Clipboard', 1500);
};

document.getElementById('modal-overlay').onclick = e => {
  if (e.target === document.getElementById('modal-overlay'))
    document.getElementById('modal-overlay').classList.add('hidden');
};

/* ═══════════════════════════════════════════════════════════
   NODE DRAG RE-RENDER
   ═══════════════════════════════════════════════════════════ */

window.addEventListener('node-dragged', () => render());

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */

init();
