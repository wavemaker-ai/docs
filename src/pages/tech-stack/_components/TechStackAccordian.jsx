import React from 'react';
import styles from '../styles.module.css';
import { Accordian } from '../../../components/MDXComponents/LayoutComponents/Accordian/Accordian';

// Composes Accordian with tech-stack's "has changes" styling, via its
// className/headerClassName/contentClassName props (never Accordian's
// internal class names directly) — same idea as ReleaseNotesTabs wrapping
// TabsWrapper/TabItem.
export function TechStackAccordian({ name, hasChanges, children }) {
  return (
    <Accordian
      className={hasChanges ? styles.accordionHasChanges : undefined}
      headerClassName={
        hasChanges ? styles.accordionHeaderHasChanges : undefined
      }
      contentClassName={styles.accordionContent}
      title={
        <>
          {name}
          {hasChanges && <span className={styles.changeBadge}>Changes</span>}
        </>
      }
    >
      {children}
    </Accordian>
  );
}

export default TechStackAccordian;
