import React, { useMemo } from 'react';
import Layout from '@theme/Layout';
import {
  versions,
  versionDataMap,
} from '../../../data/tech-stack-data/versionDataMap';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';
import { useLocation, useHistory } from '@docusaurus/router';
import {
  TabsWrapper,
  TabItem,
} from '../../components/MDXComponents/LayoutComponents/Tabs/Tabs';
import { TechStackSection } from './_components/TechStackSection';
import {
  isNonEmpty,
  parseNode,
  resolveSharedNodes,
  useTechStackDiff,
} from './_components/techStackDiff';

function formatVersion(v) {
  return 'v' + v.replace(/-/g, '.');
}

const NO_COMPARE = 'none';

export default function TechStackPage() {
  const location = useLocation();
  const history = useHistory();
  const query = new URLSearchParams(location.search);
  const selectedVersion = query.get('v') || versions[0];
  const compareParam = query.get('compare');

  // Compare with the immediate predecessor unless the user picks another
  // version (`?compare=<version>`) or turns comparison off (`?compare=none`).
  const previousVersion = versions[versions.indexOf(selectedVersion) + 1];
  let compareVersion = previousVersion ?? null;
  if (compareParam === NO_COMPARE) {
    compareVersion = null;
  } else if (
    compareParam &&
    compareParam !== selectedVersion &&
    versionDataMap[compareParam]
  ) {
    compareVersion = compareParam;
  }

  const sections = useMemo(
    () => resolveSharedNodes(versionDataMap[selectedVersion]) ?? null,
    [selectedVersion],
  );
  const prevSections = useMemo(
    () =>
      compareVersion
        ? resolveSharedNodes(versionDataMap[compareVersion])
        : null,
    [compareVersion],
  );

  const updateQuery = (key, value) => {
    const params = new URLSearchParams(location.search);
    params.set(key, value);
    history.push({ search: params.toString() });
  };

  const diff = useTechStackDiff(sections, prevSections, compareVersion);

  if (!sections) {
    return (
      <Layout title="Tech Stack">
        <div className="container margin-vert--lg">
          <h1>Version not found</h1>
          <p>
            The selected version <strong>{selectedVersion}</strong> could not be
            loaded.
          </p>
          <Link to="/tech-stack">Back to latest</Link>
        </div>
      </Layout>
    );
  }

  const visibleCategories = Object.entries(sections).filter(([, subCats]) =>
    isNonEmpty(subCats),
  );

  return (
    <Layout
      title="Tech Stack"
      description="WaveMaker Tech Stack versions and libraries"
    >
      <main className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Tech Stack</h1>
            <p className={styles.subtitle}>
              Detailed information about the frameworks and libraries used in
              WaveMaker.
            </p>
          </div>
          <div className={styles.selectors}>
            <div className={styles.versionSelector}>
              <label htmlFor="version-select">Select Version:</label>
              <select
                id="version-select"
                value={selectedVersion}
                onChange={(e) => updateQuery('v', e.target.value)}
                className={styles.select}
              >
                {versions.map((v) => (
                  <option key={v} value={v}>
                    {formatVersion(v)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.versionSelector}>
              <label htmlFor="compare-select">Compare With:</label>
              <select
                id="compare-select"
                value={compareVersion ?? NO_COMPARE}
                onChange={(e) => updateQuery('compare', e.target.value)}
                className={styles.select}
              >
                <option value={NO_COMPARE}>No comparison</option>
                {versions
                  .filter((v) => v !== selectedVersion)
                  .map((v) => (
                    <option key={v} value={v}>
                      {formatVersion(v)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {compareVersion && (
          <div className={styles.legend} aria-label="Legend">
            <span>Compared with {formatVersion(compareVersion)}:</span>
            <span className={`${styles.badge} ${styles.badgeAdded}`}>New</span>
            <span className={`${styles.badge} ${styles.badgeUpdated}`}>
              Updated version
            </span>
            <span className={`${styles.badge} ${styles.badgeRemoved}`}>
              Removed
            </span>
            <span className={styles.changeBadge}>Section has changes</span>
          </div>
        )}

        <div className={styles.content}>
          <TabsWrapper>
            {visibleCategories.map(([category, subCats]) => (
              <TabItem
                key={category}
                name={category}
                count={diff.byCategory[category]}
              >
                <div className={styles.section}>
                  {parseNode(subCats).description && (
                    <p className={styles.categoryDesc}>
                      {parseNode(subCats).description}
                    </p>
                  )}
                  <TechStackSection
                    category={category}
                    data={subCats}
                    diff={diff}
                  />
                </div>
              </TabItem>
            ))}
          </TabsWrapper>
        </div>
      </main>
    </Layout>
  );
}
