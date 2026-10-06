import { useMemo } from 'react';

const KEY_SEP = '::';

// A node is either a bare array of libraries, or an object with optional
// reserved keys `description` (string) and `libraries` (array); every other
// key is a child node. `link` ({ label, url }) is an optional footer link.
// `appliesTo` is reserved for top-level shared nodes and
// is consumed by resolveSharedNodes.
export function parseNode(node) {
  if (Array.isArray(node)) {
    return {
      description: undefined,
      libraries: node,
      link: undefined,
      children: {},
    };
  }
  // eslint-disable-next-line no-unused-vars
  const { description, libraries, link, appliesTo, ...children } = node || {};
  return { description, libraries, link, children };
}

function insertNode(platformNode, key, node, after) {
  const entries = Object.entries(platformNode);
  if (entries.some(([k]) => k === key)) {
    throw new Error(
      `Tech stack data error: shared node "${key}" already exists in the target platform.`,
    );
  }
  let index = entries.length;
  if (after) {
    const afterIndex = entries.findIndex(([k]) => k === after);
    if (afterIndex === -1) {
      throw new Error(
        `Tech stack data error: shared node "${key}" wants to go after "${after}", which does not exist in the target platform.`,
      );
    }
    index = afterIndex + 1;
  }
  entries.splice(index, 0, [key, node]);
  return Object.fromEntries(entries);
}

// A top-level node with `appliesTo` is not a tab of its own: it is copied into
// each listed platform, e.g.
//   "Backend": { "appliesTo": { "Web": { "after": "Some node" },
//                               "Mobile": {} }, "libraries": [...] }
// `after` (optional) names the sibling to insert behind; the default is the
// end. Top-level nodes without `appliesTo` render as normal tabs.
export function resolveSharedNodes(data) {
  if (!data) return data;
  const result = {};
  const shared = [];
  Object.entries(data).forEach(([key, node]) => {
    if (key === '$schema') return; // editor hint, validated by tech-stack.schema.json
    if (node && !Array.isArray(node) && node.appliesTo) {
      shared.push([key, node]);
    } else {
      result[key] = node;
    }
  });

  shared.forEach(([key, { appliesTo, ...node }]) => {
    Object.entries(appliesTo).forEach(([platform, options]) => {
      if (!result[platform]) {
        throw new Error(
          `Tech stack data error: shared node "${key}" applies to unknown platform "${platform}".`,
        );
      }
      result[platform] = insertNode(
        result[platform],
        key,
        node,
        options?.after,
      );
    });
  });
  return result;
}

export function isNonEmpty(content) {
  if (!content) return false;
  const { libraries, children } = parseNode(content);
  if (libraries?.length > 0) return true;
  return Object.values(children).some(isNonEmpty);
}

// fullPath includes every key from the category down to the array's own
// key, so same-named arrays under different subsections don't collide.
export function makeGroupKey(category, fullPath) {
  return `${category}${KEY_SEP}${fullPath.join('/')}`;
}

export function makeItemKey(groupKey, itemName) {
  return `${groupKey}${KEY_SEP}${itemName}`;
}

export function getCategoryFromGroupKey(groupKey) {
  return groupKey.split(KEY_SEP)[0];
}

function assertNoKeySeparator(value, label) {
  if (typeof value === 'string' && value.includes(KEY_SEP)) {
    throw new Error(
      `Tech stack data error: ${label} "${value}" contains "${KEY_SEP}", ` +
        'which is reserved for internal key-building and not allowed in tech-stack data.',
    );
  }
}

// { map: itemKey -> version, groups: groupKey -> [{ name, version }] }
function buildLibIndex(data) {
  const map = {};
  const groups = {};
  if (data) {
    const traverse = (category, node, path = []) => {
      const { libraries: content, children } = parseNode(node);
      if (content) {
        const groupKey = makeGroupKey(category, path);
        const seenNames = new Set();

        content.forEach((item) => {
          if (!item.name) {
            throw new Error(
              `Tech stack data error: an item in "${groupKey}" is missing a "name".`,
            );
          }
          assertNoKeySeparator(item.name, 'a library name');
          if (seenNames.has(item.name)) {
            throw new Error(
              `Tech stack data error: duplicate library name "${item.name}" in "${groupKey}" — names must be unique within an accordion.`,
            );
          }
          seenNames.add(item.name);
        });

        groups[groupKey] = content.map((item) => ({
          name: item.name,
          version: item.version,
        }));
        content.forEach((item) => {
          map[makeItemKey(groupKey, item.name)] = item.version;
        });
      }
      Object.entries(children).forEach(([key, value]) => {
        assertNoKeySeparator(key, 'a category/subsection key');
        traverse(category, value, [...path, key]);
      });
    };

    Object.entries(data).forEach(([category, subCats]) => {
      assertNoKeySeparator(category, 'a category name');
      traverse(category, subCats);
    });
  }
  return { map, groups };
}

// byItem: itemKey -> { type: 'added' } | { type: 'updated', oldVersion }
// byGroup: groupKey -> { hasChanges, changedCount, removed: [{name, version}] }
// byCategory: category -> total changed (added + updated + removed) count
export function useTechStackDiff(sections, prevSections, previousVersion) {
  const currentLibIndex = useMemo(() => buildLibIndex(sections), [sections]);
  const prevLibIndex = useMemo(
    () => buildLibIndex(prevSections),
    [prevSections],
  );

  return useMemo(() => {
    const byItem = {};
    const byGroup = {};
    const byCategory = {};

    if (!previousVersion) {
      return { byItem, byGroup, byCategory };
    }

    Object.entries(currentLibIndex.groups).forEach(([groupKey, items]) => {
      let changedCount = 0;

      items.forEach((item) => {
        const itemKey = makeItemKey(groupKey, item.name);
        if (!(itemKey in prevLibIndex.map)) {
          byItem[itemKey] = { type: 'added' };
          changedCount += 1;
        } else if (prevLibIndex.map[itemKey] !== item.version) {
          byItem[itemKey] = {
            type: 'updated',
            oldVersion: prevLibIndex.map[itemKey],
          };
          changedCount += 1;
        }
      });

      byGroup[groupKey] = { changedCount, removed: [], hasChanges: false };
    });

    Object.entries(prevLibIndex.groups).forEach(([groupKey, items]) => {
      const removed = items.filter(
        (item) => !(makeItemKey(groupKey, item.name) in currentLibIndex.map),
      );
      if (removed.length === 0) return;
      const existing = byGroup[groupKey] || {
        changedCount: 0,
        removed: [],
        hasChanges: false,
      };
      byGroup[groupKey] = { ...existing, removed };
    });

    Object.entries(byGroup).forEach(([groupKey, group]) => {
      const total = group.changedCount + group.removed.length;
      byGroup[groupKey] = { ...group, hasChanges: total > 0 };
      if (total > 0) {
        const category = getCategoryFromGroupKey(groupKey);
        byCategory[category] = (byCategory[category] || 0) + total;
      }
    });

    return { byItem, byGroup, byCategory };
  }, [currentLibIndex, prevLibIndex, previousVersion]);
}
