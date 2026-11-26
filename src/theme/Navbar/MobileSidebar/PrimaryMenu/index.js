import React from 'react';
import PrimaryMenu from '@theme-original/Navbar/MobileSidebar/PrimaryMenu';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import styles from './styles.module.css';

// The default mobile menu, plus the "Schedule Demo" button at its bottom
// (on phones the navbar has no room for it).
export default function PrimaryMenuWrapper(props) {
  const mobileSidebar = useNavbarMobileSidebar();
  const {
    siteConfig: {
      customFields: { demoUrl },
    },
  } = useDocusaurusContext();
  return (
    <>
      <PrimaryMenu {...props} />
      <div className={styles.demo}>
        <Link
          to={demoUrl}
          className="button button--primary button--block"
          onClick={() => mobileSidebar.toggle()}
        >
          Schedule Demo
        </Link>
      </div>
    </>
  );
}
