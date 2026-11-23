import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const CLASSIC_DOCS_URL = '/learn/';
// Nothing serves /learn on a local dev server, so point at the live classic docs instead.
const LOCAL_CLASSIC_DOCS_URL = 'https://docs.wavemaker.ai/learn/';
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

// The host is read after mount so the server-rendered HTML and the first client render stay identical.
function useClassicDocsUrl() {
  const [url, setUrl] = useState(CLASSIC_DOCS_URL);
  useEffect(() => {
    if (LOCAL_HOSTS.includes(window.location.hostname)) {
      setUrl(LOCAL_CLASSIC_DOCS_URL);
    }
  }, []);
  return url;
}

export default function DocsSwitcher({ placement = 'navbar', className }) {
  const classicDocsUrl = useClassicDocsUrl();
  return (
    <div
      className={clsx(
        styles.switcher,
        placement === 'drawer' ? styles.drawer : styles.navbar,
        className,
      )}
      role="group"
      aria-label="Choose documentation site"
    >
      <span
        className={clsx(styles.option, styles.active)}
        aria-current="true"
        title="AI docs (v12 and later)"
      >
        <span className={styles.full}>AI (v12+)</span>
        <span className={styles.short}>v12+</span>
      </span>
      {/* Plain anchor: <Link> would prefix the absolute site url on every host. */}
      {/* eslint-disable-next-line @docusaurus/no-html-links */}
      <a
        className={styles.option}
        href={classicDocsUrl}
        title="Classic docs (v11.x and below)"
      >
        <span className={styles.full}>Classic (v11.x & below)</span>
        <span className={styles.short}>{'< v12'}</span>
      </a>
    </div>
  );
}
