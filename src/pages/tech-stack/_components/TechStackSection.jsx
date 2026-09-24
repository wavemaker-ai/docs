import React from 'react';
import styles from '../styles.module.css';
import { TechStackAccordian } from './TechStackAccordian';
import { LibraryRow } from './LibraryRow';
import { isNonEmpty, makeGroupKey, makeItemKey } from './techStackDiff';

// Recursively renders subsections (as `<h3>`) down to arrays of libraries
// (as a TechStackAccordian). `path` ties a rendered group back to its diff
// data via makeGroupKey.
export function TechStackSection({ category, data, path = [], diff }) {
  const entries = Object.entries(data);
  const hasSubsectionsAtThisLevel = entries.some(
    ([, value]) => value && typeof value === 'object' && !Array.isArray(value),
  );

  return entries.map(([name, value]) => {
    if (!isNonEmpty(value)) return null;

    if (!Array.isArray(value)) {
      return (
        <div key={name} className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>{name}</h3>
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
      <TechStackAccordian key={name} name={name} hasChanges={accordionChanged}>
        <ul className={styles.list}>
          {value.map((item) => (
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

    if (hasSubsectionsAtThisLevel) {
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
