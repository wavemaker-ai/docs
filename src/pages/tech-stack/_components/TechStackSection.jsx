import React from 'react';
import styles from '../styles.module.css';
import { TechStackAccordian } from './TechStackAccordian';
import { LibraryRow } from './LibraryRow';
import {
  isNonEmpty,
  makeGroupKey,
  makeItemKey,
  parseNode,
} from './techStackDiff';

// Sums diff counts for every group under `prefixPath`, so a parent accordion
// can show a "Changes" badge when any nested group changed.
function subtreeHasChanges(diff, category, prefixPath) {
  const prefix = `${makeGroupKey(category, prefixPath)}/`;
  return Object.entries(diff.byGroup).some(
    ([key, group]) => key.startsWith(prefix) && group.hasChanges,
  );
}

// Recursively renders data down to arrays of libraries (as a
// TechStackAccordian). Top-level entries of a category (e.g. "Frontend/UI")
// render as parent accordions holding their groups as child accordions, or
// their libraries directly when the entry holds no child groups; deeper
// entries with children render as `<h3>` subsections. Each node's optional
// `description` is shown under its title. `path` ties a rendered group
// back to its diff data via makeGroupKey.
export function TechStackSection({ category, data, path = [], diff }) {
  const entries = Object.entries(parseNode(data).children);
  const hasSubsectionsAtThisLevel = entries.some(
    ([, value]) => Object.keys(parseNode(value).children).length > 0,
  );

  return entries.map(([name, value]) => {
    if (!isNonEmpty(value)) return null;
    const { description, libraries, children } = parseNode(value);
    const hasChildren = Object.keys(children).length > 0;

    if (hasChildren && path.length === 0) {
      return (
        <TechStackAccordian
          key={name}
          name={name}
          description={description}
          hasChanges={subtreeHasChanges(diff, category, [name])}
        >
          <TechStackSection
            category={category}
            data={value}
            path={[name]}
            diff={diff}
          />
        </TechStackAccordian>
      );
    }

    if (hasChildren) {
      return (
        <div key={name} className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>{name}</h3>
          {description && <p className={styles.categoryDesc}>{description}</p>}
          <TechStackSection
            category={category}
            data={value}
            path={[...path, name]}
            diff={diff}
          />
        </div>
      );
    }

    const groupKey = makeGroupKey(category, [...path, name]);
    const group = diff.byGroup[groupKey];
    const accordionChanged = Boolean(group?.hasChanges);
    const removedItems = group?.removed ?? [];

    const accordion = (
      <TechStackAccordian
        key={name}
        name={name}
        description={description}
        hasChanges={accordionChanged}
      >
        <ul className={styles.list}>
          {libraries.map((item) => (
            <LibraryRow
              key={item.name}
              item={item}
              status={diff.byItem[makeItemKey(groupKey, item.name)]}
            />
          ))}
          {removedItems.map((item) => (
            <LibraryRow
              key={`removed-${item.name}`}
              item={item}
              status={{ type: 'removed' }}
            />
          ))}
        </ul>
      </TechStackAccordian>
    );

    if (hasSubsectionsAtThisLevel && path.length > 0) {
      return (
        <div key={name} className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>{name}</h3>
          {accordion}
        </div>
      );
    }
    return accordion;
  });
}

export default TechStackSection;
