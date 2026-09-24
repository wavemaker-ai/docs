import { useMemo } from 'react';

const KEY_SEP = '::';

export function isNonEmpty(content) {
  if (!content) return false;
  if (Array.isArray(content)) return content.length > 0;
  if (typeof content === 'object') {
    return Object.values(content).some(isNonEmpty);
  }
  return false;
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
    const traverse = (category, content, path = []) => {
      if (Array.isArray(content)) {
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
      } else if (content && typeof content === 'object') {
        Object.entries(content).forEach(([key, value]) => {
          assertNoKeySeparator(key, 'a category/subsection key');
          traverse(category, value, [...path, key]);
        });
      }
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
