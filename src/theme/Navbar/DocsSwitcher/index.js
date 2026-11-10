import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

// Switches between this site (AI docs) and the classic docs, which are proxied
// under /learn by the Amplify rewrite. `pathname://` forces a full page load so
// the Docusaurus router does not try to resolve /learn as one of its own routes.
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
      {/* Docusaurus Link adds target="_blank" to non-internal URLs; keep the same tab. */}
      <Link className={styles.option} to="pathname:///learn/" target="_self">
        Classic (v11.x & below)
      </Link>
    </div>
  );
}
