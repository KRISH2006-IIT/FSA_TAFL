/**
 * Analysis Service
 * Performs FSM structural analysis: dead-end detection, reachability, validation.
 */

const { bfs, buildAdjacencyList, buildTransitionMaps } = require('../utils/graphAlgorithms');

/**
 * Analyzes an FSM for structural issues.
 * @param {Object} fsm - The FSM data object { states, startState, transitions }.
 * @returns {{ valid: boolean, deadEnds: string[], unreachable: string[], outgoing: Object }}
 */
function analyzeFsm(fsm) {
  const { outgoing, incoming } = buildTransitionMaps(fsm.states, fsm.transitions);

  // Dead-end states: no outgoing transitions
  const deadEnds = fsm.states.filter(s => outgoing[s].length === 0);

  // Reachability: BFS from start state
  const adjacency = buildAdjacencyList(fsm.states, fsm.transitions);
  const reachable = bfs(fsm.startState, adjacency);
  const unreachable = fsm.states.filter(s => !reachable.has(s));

  // Overall validity
  const valid = !!fsm.startState && deadEnds.length === 0 && unreachable.length === 0;

  return { valid, deadEnds, unreachable, outgoing };
}

module.exports = { analyzeFsm };
