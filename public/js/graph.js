/**
 * Graph Rendering Module
 * D3.js-based FSM visualization: nodes, edges, labels, zoom, drag, tooltips, animation.
 */

const NODE_R = 36;
let svgGroup = null;
let zoom = null;
let nodePositions = {};

/**
 * Returns the current node positions map.
 */
export function getNodePositions() {
  return nodePositions;
}

/**
 * Resets node positions (e.g. on import or reset).
 */
export function resetNodePositions() {
  nodePositions = {};
}

/**
 * Calculates initial circular layout for nodes.
 * @param {string[]} states - Array of state names.
 */
export function layoutNodes(states) {
  const cx = 400, cy = 300, r = 180;
  states.forEach((s, i) => {
    if (!nodePositions[s]) {
      const a = (2 * Math.PI * i / states.length) - Math.PI / 2;
      nodePositions[s] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }
  });
}

/**
 * Adds a position for a new state (random near center).
 * @param {string} name
 */
export function addNodePosition(name) {
  if (!nodePositions[name]) {
    const cx = 400 + Math.random() * 200 - 100;
    const cy = 300 + Math.random() * 200 - 100;
    nodePositions[name] = { x: cx, y: cy };
  }
}

/**
 * Removes position data for a deleted state.
 * @param {string} name
 */
export function removeNodePosition(name) {
  delete nodePositions[name];
}

/**
 * Main render function — draws the full FSM graph.
 * @param {Object} fsm - { states, startState, transitions }
 * @param {Object|null} analysisResult - { deadEnds, unreachable, valid, outgoing }
 * @param {Object} simState - { active, current, trace }
 * @param {Function} onRenderComplete - Callback after rendering.
 */
export function renderGraph(fsm, analysisResult, simState, onRenderComplete) {
  const svg = d3.select('#fsm-canvas');
  svg.selectAll('*').remove();

  // ── Defs ──
  const defs = svg.append('defs');

  // Glow filter for animation
  const filter = defs.append('filter').attr('id', 'glow')
    .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
  filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  // Default arrow marker
  defs.append('marker').attr('id', 'arrow').attr('viewBox', '0 0 10 10')
    .attr('refX', 10).attr('refY', 5)
    .attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto-start-reverse')
    .append('path').attr('d', 'M0,0 L10,5 L0,10 Z').attr('fill', 'rgba(148, 163, 184, 0.4)');

  // Colored arrow markers
  ['accent', 'error', 'valid', 'warn', 'teal', 'cyan'].forEach(c => {
    defs.append('marker').attr('id', 'arrow-' + c).attr('viewBox', '0 0 10 10')
      .attr('refX', 10).attr('refY', 5)
      .attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M0,0 L10,5 L0,10 Z').attr('fill', `var(--${c === 'teal' ? 'cyan' : c})`);
  });

  svgGroup = svg.append('g').attr('class', 'graph-root');

  // ── Zoom ──
  zoom = d3.zoom().scaleExtent([.3, 3]).on('zoom', e => svgGroup.attr('transform', e.transform));
  svg.call(zoom);
  svgGroup.attr('transform', d3.zoomTransform(svg.node()));

  // ── Tooltip ──
  let tooltip = d3.select('.tooltip');
  if (tooltip.empty()) tooltip = d3.select('#center-panel').append('div').attr('class', 'tooltip');

  // ── Draw Edges ──
  drawEdges(fsm, svgGroup);

  // ── Draw Nodes ──
  drawNodes(fsm, analysisResult, simState, svgGroup, tooltip);

  if (onRenderComplete) onRenderComplete();
}

/**
 * Draws all edges with proper separation for bidirectional and parallel transitions.
 */
function drawEdges(fsm, svgGroup) {
  // Group transitions by directed (from→to) key
  const directedGroups = {};
  fsm.transitions.forEach(t => {
    const key = t.from + '→' + t.to;
    if (!directedGroups[key]) directedGroups[key] = [];
    directedGroups[key].push(t);
  });

  const edgeG = svgGroup.append('g').attr('class', 'edges');
  const drawnGroups = new Set();

  Object.keys(directedGroups).forEach(key => {
    if (drawnGroups.has(key)) return;
    drawnGroups.add(key);

    const group = directedGroups[key];
    const from = group[0].from, to = group[0].to;
    const p1 = nodePositions[from], p2 = nodePositions[to];
    if (!p1 || !p2) return;

    const isSelf = from === to;
    const reverseKey = to + '→' + from;
    const reverseGroup = directedGroups[reverseKey] || [];
    const hasBi = reverseGroup.length > 0;

    if (hasBi && !drawnGroups.has(reverseKey)) {
      drawnGroups.add(reverseKey);
    }

    const allForward = group;
    const allReverse = hasBi ? reverseGroup : [];

    if (isSelf) {
      // Self-loops
      allForward.forEach((t, idx) => {
        const angle = -Math.PI / 2 + idx * 0.6 - (allForward.length - 1) * 0.3;
        const cx1 = p1.x + (NODE_R + 45) * Math.cos(angle - 0.4);
        const cy1 = p1.y + (NODE_R + 45) * Math.sin(angle - 0.4);
        const cx2 = p1.x + (NODE_R + 45) * Math.cos(angle + 0.4);
        const cy2 = p1.y + (NODE_R + 45) * Math.sin(angle + 0.4);
        const sx = p1.x + NODE_R * Math.cos(angle - 0.35);
        const sy = p1.y + NODE_R * Math.sin(angle - 0.35);
        const ex = p1.x + NODE_R * Math.cos(angle + 0.35);
        const ey = p1.y + NODE_R * Math.sin(angle + 0.35);
        const pathD = `M${sx},${sy} C${cx1},${cy1} ${cx2},${cy2} ${ex},${ey}`;
        const labelX = p1.x + (NODE_R + 55) * Math.cos(angle);
        const labelY = p1.y + (NODE_R + 55) * Math.sin(angle);

        edgeG.append('path').attr('class', 'edge-path')
          .attr('d', pathD).attr('fill', 'none').attr('stroke', 'rgba(148, 163, 184, 0.28)')
          .attr('stroke-width', 1.8).attr('marker-end', 'url(#arrow)')
          .attr('data-from', t.from).attr('data-to', t.to);

        edgeG.append('text').attr('class', 'edge-label')
          .attr('x', labelX).attr('y', labelY)
          .attr('text-anchor', 'middle').attr('dy', '3').text(t.action);
      });
    } else {
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len, uy = dy / len;
      const px = -uy, py = ux;

      // Forward transitions
      const totalForward = allForward.length;
      allForward.forEach((t, idx) => {
        const sx = p1.x + ux * NODE_R, sy = p1.y + uy * NODE_R;
        const ex = p2.x - ux * NODE_R, ey = p2.y - uy * NODE_R;

        let pathD, labelPos;
        const baseOff = hasBi ? 35 : 0;
        const parallelSpacing = 25;
        const parallelOff = totalForward > 1 ? (idx - (totalForward - 1) / 2) * parallelSpacing : 0;
        const totalOff = baseOff + parallelOff;

        if (Math.abs(totalOff) < 3) {
          pathD = `M${sx},${sy} L${ex},${ey}`;
          labelPos = { x: (sx + ex) / 2 + px * 14, y: (sy + ey) / 2 + py * 14 };
        } else {
          const mx = (sx + ex) / 2 + px * totalOff;
          const my = (sy + ey) / 2 + py * totalOff;
          pathD = `M${sx},${sy} Q${mx},${my} ${ex},${ey}`;
          const lx = 0.25 * sx + 0.5 * mx + 0.25 * ex;
          const ly = 0.25 * sy + 0.5 * my + 0.25 * ey;
          labelPos = { x: lx + px * 10, y: ly + py * 10 };
        }

        edgeG.append('path').attr('class', 'edge-path')
          .attr('d', pathD).attr('fill', 'none').attr('stroke', 'rgba(148, 163, 184, 0.28)')
          .attr('stroke-width', 1.8).attr('marker-end', 'url(#arrow)')
          .attr('data-from', t.from).attr('data-to', t.to);

        edgeG.append('text').attr('class', 'edge-label')
          .attr('x', labelPos.x).attr('y', labelPos.y)
          .attr('text-anchor', 'middle').attr('dy', '-4').text(t.action);
      });

      // Reverse transitions (bidirectional)
      const totalReverse = allReverse.length;
      allReverse.forEach((t, idx) => {
        const sx = p2.x - ux * NODE_R, sy = p2.y - uy * NODE_R;
        const ex = p1.x + ux * NODE_R, ey = p1.y + uy * NODE_R;

        const baseOff = -35;
        const parallelSpacing = 25;
        const parallelOff = totalReverse > 1 ? (idx - (totalReverse - 1) / 2) * parallelSpacing : 0;
        const totalOff = baseOff + parallelOff;

        const mx = (sx + ex) / 2 + px * totalOff;
        const my = (sy + ey) / 2 + py * totalOff;
        const pathD = `M${sx},${sy} Q${mx},${my} ${ex},${ey}`;
        const lx = 0.25 * sx + 0.5 * mx + 0.25 * ex;
        const ly = 0.25 * sy + 0.5 * my + 0.25 * ey;
        const labelPos = { x: lx + px * 10, y: ly + py * 10 };

        edgeG.append('path').attr('class', 'edge-path')
          .attr('d', pathD).attr('fill', 'none').attr('stroke', 'rgba(148, 163, 184, 0.28)')
          .attr('stroke-width', 1.8).attr('marker-end', 'url(#arrow)')
          .attr('data-from', t.from).attr('data-to', t.to);

        edgeG.append('text').attr('class', 'edge-label')
          .attr('x', labelPos.x).attr('y', labelPos.y)
          .attr('text-anchor', 'middle').attr('dy', '-4').text(t.action);
      });
    }
  });
}

/**
 * Draws all FSM state nodes with colors, labels, and interactivity.
 */
function drawNodes(fsm, analysisResult, simState, svgGroup, tooltip) {
  const nodeG = svgGroup.append('g').attr('class', 'nodes');

  fsm.states.forEach(s => {
    const pos = nodePositions[s];
    if (!pos) return;
    const g = nodeG.append('g')
      .attr('transform', `translate(${pos.x},${pos.y})`)
      .attr('class', 'node-group');

    // Determine color
    let fill = 'var(--cyan)', stroke = 'rgba(255, 255, 255, 0.25)';
    let isSpecial = false;
    
    if (simState.active && simState.current === s) {
      fill = 'var(--cyan)'; stroke = 'var(--cyan)';
      isSpecial = true;
    } else if (s === fsm.startState) {
      fill = 'var(--accent)'; stroke = 'var(--accent)';
      isSpecial = true;
    } else if (analysisResult) {
      if (analysisResult.deadEnds.includes(s)) {
        fill = 'var(--error)'; stroke = 'var(--error)';
        isSpecial = true;
      } else if (analysisResult.unreachable.includes(s)) {
        fill = 'var(--warn)'; stroke = 'var(--warn)';
        isSpecial = true;
      }
    }

    g.append('circle').attr('r', NODE_R)
      .attr('fill', fill)
      .attr('fill-opacity', isSpecial ? 0.12 : 0.05)
      .attr('stroke', stroke)
      .attr('stroke-width', s === fsm.startState ? 3 : 1.8)
      .attr('filter', isSpecial ? 'url(#glow)' : null)
      .style('transition', 'all .3s ease');

    // Start state indicator (dashed outer ring)
    if (s === fsm.startState) {
      g.append('circle').attr('r', NODE_R + 6).attr('fill', 'none')
        .attr('stroke', 'var(--accent)').attr('stroke-width', 1.5).attr('stroke-dasharray', '4 3')
        .attr('filter', 'url(#glow)');
    }

    g.append('text').attr('class', 'node-label').attr('dy', 4).text(s);

    // Drag behavior
    const drag = d3.drag()
      .on('drag', (e) => {
        nodePositions[s].x = e.x;
        nodePositions[s].y = e.y;
        // Dispatch custom event so app.js can re-render
        window.dispatchEvent(new CustomEvent('node-dragged'));
      });
    g.call(drag);

    // Tooltip
    g.on('mouseenter', (e) => {
      const out = fsm.transitions.filter(t => t.from === s);
      let html = `<h4>${s}</h4><ul>${out.map(t => `<li>→ ${t.to} [${t.action}]</li>`).join('')}</ul>`;
      if (!out.length) html += `<p style="color:var(--error);font-size:.75rem">No outgoing transitions</p>`;
      tooltip.html(html).classed('show', true)
        .style('left', (e.offsetX + 16) + 'px').style('top', (e.offsetY - 8) + 'px');
    }).on('mouseleave', () => tooltip.classed('show', false));
  });
}

/**
 * Animates a transition edge (used during simulation).
 * @param {string} from - Source state.
 * @param {string} to - Target state.
 * @param {Function} onDone - Callback when animation completes.
 */
export function animateEdge(from, to, onDone) {
  let basePath = null;
  d3.selectAll('.edge-path').each(function () {
    const el = d3.select(this);
    if (el.attr('data-from') === from && el.attr('data-to') === to) basePath = this;
  });
  if (!basePath) { if (onDone) onDone(); return; }

  const pathD = basePath.getAttribute('d');
  const totalLen = basePath.getTotalLength();

  // Overlay path with glow
  const overlay = svgGroup.append('path')
    .attr('d', pathD)
    .attr('fill', 'none')
    .attr('stroke', 'var(--cyan)')
    .attr('stroke-width', 5)
    .attr('stroke-linecap', 'round')
    .attr('filter', 'url(#glow)')
    .attr('marker-end', 'url(#arrow-cyan)')
    .attr('pointer-events', 'none')
    .attr('stroke-dasharray', totalLen)
    .attr('stroke-dashoffset', totalLen);

  // Pulse the base edge
  d3.select(basePath)
    .transition().duration(100)
    .attr('stroke', 'var(--cyan)').attr('stroke-width', 2.8)
    .transition().duration(600)
    .attr('stroke', 'rgba(148, 163, 184, 0.28)').attr('stroke-width', 1.8);

  // Animate overlay
  overlay.transition()
    .duration(700)
    .ease(d3.easeCubicInOut)
    .attr('stroke-dashoffset', 0)
    .on('end', function () {
      d3.select(this).transition().duration(250).attr('stroke-opacity', 0)
        .on('end', function () { d3.select(this).remove(); if (onDone) onDone(); });
    });
}

/**
 * Sets up the graph toolbar.
 */
export function initToolbar() {
  document.getElementById('graph-toolbar').innerHTML =
    `<div style="display:flex;align-items:center;gap:8px;font-size:.75rem;color:var(--text-muted);font-family:var(--font-mono)">
      <i data-lucide="info" style="width:14px;height:14px;color:var(--cyan)"></i>
      <span>Scroll to zoom/pan · Drag states to reposition</span>
    </div>`;
}
