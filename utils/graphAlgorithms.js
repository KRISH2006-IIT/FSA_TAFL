/**
 * Graph Algorithms Utility
 * Pure functions for BFS traversal and graph analysis.
 */

/**
 * Performs Breadth-First Search from a start node.
 * @param {string} startNode - The starting node for traversal.
 * @param {Object} adjacencyList - Map of node -> array of neighbor nodes.
 * @returns {Set<string>} Set of all reachable nodes (including startNode).
 */
function bfs(startNode, adjacencyList) {
  const visited = new Set();
  if (!startNode || !adjacencyList[startNode]) return visited;

  const queue = [startNode];
  visited.add(startNode);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adjacencyList[current] || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return visited;
}

/**
 * Builds an adjacency list (outgoing neighbors) from transitions.
 * @param {Array} states - Array of state names.
 * @param {Array} transitions - Array of { from, to, action } objects.
 * @returns {Object} Map of state -> array of neighbor state names.
 */
function buildAdjacencyList(states, transitions) {
  const adj = {};
  states.forEach(s => { adj[s] = []; });
  transitions.forEach(t => {
    if (adj[t.from]) {
      adj[t.from].push(t.to);
    }
  });
  return adj;
}

/**
 * Builds outgoing and incoming transition maps.
 * @param {Array} states - Array of state names.
 * @param {Array} transitions - Array of { from, to, action } objects.
 * @returns {{ outgoing: Object, incoming: Object }}
 */
function buildTransitionMaps(states, transitions) {
  const outgoing = {};
  const incoming = {};
  states.forEach(s => { outgoing[s] = []; incoming[s] = []; });
  transitions.forEach(t => {
    if (outgoing[t.from]) outgoing[t.from].push(t);
    if (incoming[t.to]) incoming[t.to].push(t);
  });
  return { outgoing, incoming };
}

module.exports = { bfs, buildAdjacencyList, buildTransitionMaps };
