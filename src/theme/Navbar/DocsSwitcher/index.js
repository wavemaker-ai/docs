import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function DocsSwitcher({ className }) {
  return (
    <div
      className={clsx(styles.switcher, className)}
      role="group"
      aria-label="Choose documentation site"
    >
      <span className={clsx(styles.option, styles.active)} aria-current="true">
        AI (v12+)
      </span>
      {/* Plain anchor: <Link> would prefix the absolute site url on every host. */}
      {/* eslint-disable-next-line @docusaurus/no-html-links */}
      <a className={styles.option} href="/learn/">
        Classic (v11.x & below)
      </a>
    </div>
  );
}
