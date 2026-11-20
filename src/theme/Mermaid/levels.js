/**
 * Works out how deep each flowchart node sits, so the stylesheet can give each level its own color.
 *
 * Mermaid's SVG is flat: a node does not sit inside its parent, and the only link between two nodes
 * is an edge path whose id is `L_<from>_<to>_<n>`. The level is read from those ids, so it needs no
 * layout and works while the diagram is hidden (for example in an inactive tab).
 *
 * A node's level is one more than its deepest parent, so a child never shares a color with any of its
 * parents. Nodes with no parent are level 0. An edge that points back up a cycle is ignored.
 */

// Number of colors in the diagram palette (--wm-diagram-* in custom.css). Past this many levels the
// colors start again, which cannot be avoided with a fixed palette.
export const PALETTE_SIZE = 6;

const NODE_ID = /^flowchart-(.+)-\d+$/;
const EDGE_ID = /^L_(.+)_\d+$/;

// `L_<from>_<to>_<n>` is ambiguous when a node id contains `_`, so try each split and keep the one
// where both halves are known nodes.
function parseEdge(edgeId, nodeIds) {
  const match = EDGE_ID.exec(edgeId);
  if (!match) {
    return null;
  }
  const body = match[1];
  for (let i = body.indexOf('_'); i !== -1; i = body.indexOf('_', i + 1)) {
    const from = body.slice(0, i);
    const to = body.slice(i + 1);
    if (nodeIds.has(from) && nodeIds.has(to)) {
      return [from, to];
    }
  }
  return null;
}

/** Returns a Map of node id -> level, from the node ids and the edges between them. */
export function computeLevels(ids, edges) {
  const children = new Map(ids.map((id) => [id, []]));
  const hasParent = new Set();
  edges.forEach(([from, to]) => {
    children.get(from).push(to);
    if (from !== to) {
      hasParent.add(to);
    }
  });

  const parents = new Map(ids.map((id) => [id, []]));
  const state = new Map(); // 'open' while on the current path, 'done' once finished
  const finished = [];
  const visit = (id) => {
    state.set(id, 'open');
    children.get(id).forEach((child) => {
      if (state.get(child) === 'open') {
        return; // back edge: it would make a cycle
      }
      parents.get(child).push(id);
      if (!state.has(child)) {
        visit(child);
      }
    });
    state.set(id, 'done');
    finished.push(id);
  };
  // Start from the nodes nothing points to; the rest only matter when a cycle hides every root.
  [...ids.filter((id) => !hasParent.has(id)), ...ids].forEach((id) => {
    if (!state.has(id)) {
      visit(id);
    }
  });

  const levels = new Map();
  finished.reverse().forEach((id) => {
    levels.set(
      id,
      parents
        .get(id)
        .reduce((deepest, p) => Math.max(deepest, levels.get(p) + 1), 0),
    );
  });
  return levels;
}

/** Tags each flowchart node in a rendered diagram with `data-wm-level` (0 to PALETTE_SIZE - 1). */
export function tagLevels(container) {
  const nodes = [...container.querySelectorAll('.node')]
    .map((el) => ({ el, match: NODE_ID.exec(el.id) }))
    .filter(({ match }) => match);
  if (nodes.length === 0) {
    return; // not a flowchart
  }
  const ids = nodes.map(({ match }) => match[1]);
  const nodeIds = new Set(ids);
  const edges = [...container.querySelectorAll('path[data-edge]')]
    .map((path) => parseEdge(path.getAttribute('data-id') || path.id, nodeIds))
    .filter(Boolean);
  const levels = computeLevels(ids, edges);
  nodes.forEach(({ el, match }) => {
    el.setAttribute('data-wm-level', levels.get(match[1]) % PALETTE_SIZE);
  });
}
