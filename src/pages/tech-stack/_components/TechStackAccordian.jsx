import React from 'react';
import styles from '../styles.module.css';
import { Accordian } from '../../../components/MDXComponents/LayoutComponents/Accordian/Accordian';

// Composes Accordian with tech-stack's "has changes" styling, via its
// className/headerClassName/contentClassName props (never Accordian's
// internal class names directly) — same idea as ReleaseNotesTabs wrapping
// TabsWrapper/TabItem.
export function TechStackAccordian({
  name,
  description,
  hasChanges,
  children,
}) {
  return (
    <Accordian
      className={hasChanges ? styles.accordionHasChanges : undefined}
      headerClassName={
        hasChanges ? styles.accordionHeaderHasChanges : undefined
      }
      contentClassName={styles.accordionContent}
      title={
        <span className={styles.accordionTitle}>
          <span>
            {name}
            {hasChanges && <span className={styles.changeBadge}>Changes</span>}
          </span>
          {description && (
            <span className={styles.accordionDesc}>{description}</span>
          )}
        </span>
      }
    >
      {children}
    </Accordian>
  );
}

export default TechStackAccordian;
