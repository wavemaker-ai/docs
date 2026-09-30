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

// Renders each of a platform's nodes as an accordion of libraries, with the
// node's optional `description` under its title. `diff` ties a rendered node
// back to its diff data via makeGroupKey.
export function TechStackSection({ category, data, diff }) {
  return Object.entries(parseNode(data).children).map(([name, value]) => {
    if (!isNonEmpty(value)) return null;
    const { description, libraries } = parseNode(value);

    const groupKey = makeGroupKey(category, [name]);
    const group = diff.byGroup[groupKey];
    const removedItems = group?.removed ?? [];

    return (
      <TechStackAccordian
        key={name}
        name={name}
        description={description}
        hasChanges={Boolean(group?.hasChanges)}
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
  });
}

export default TechStackSection;
