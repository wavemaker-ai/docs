import React from 'react';
import Link from '@docusaurus/Link';
import styles from '../styles.module.css';

const ROW_CLASS_BY_STATUS = {
  added: styles.itemAdded,
  updated: styles.itemUpdated,
  removed: styles.itemRemoved,
};

function LibraryBadge({ status, currentVersion }) {
  if (!status) return null;

  if (status.type === 'added') {
    return <span className={`${styles.badge} ${styles.badgeAdded}`}>New</span>;
  }
  if (status.type === 'updated') {
    return (
      <span className={`${styles.badge} ${styles.badgeUpdated}`}>
        {status.oldVersion || 'N/A'} &rarr; {currentVersion || 'N/A'}
      </span>
    );
  }
  if (status.type === 'removed') {
    return (
      <span className={`${styles.badge} ${styles.badgeRemoved}`}>Removed</span>
    );
  }
  return null;
}

export function LibraryRow({ item, status }) {
  return (
    <li className={status ? ROW_CLASS_BY_STATUS[status.type] : ''}>
      <div className={styles.libraryInfo}>
        <span className={styles.nameRow}>
          {item.link && item.link !== '#' ? (
            <Link to={item.link} className={styles.libraryLink}>
              {item.name}
            </Link>
          ) : (
            <span className={styles.libraryName}>{item.name}</span>
          )}
          <LibraryBadge status={status} currentVersion={item.version} />
        </span>
        {item.description && (
          <span className={styles.libraryDesc}>{item.description}</span>
        )}
      </div>
      <span className={styles.libraryVersion}>{item.version || 'N/A'}</span>
    </li>
  );
}

export default LibraryRow;
