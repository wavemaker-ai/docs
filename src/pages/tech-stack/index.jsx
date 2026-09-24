import React, { useState, useEffect } from 'react';
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
import { isNonEmpty, useTechStackDiff } from './_components/techStackDiff';

function formatVersion(v) {
  return 'v' + v.replace(/-/g, '.');
}

export default function TechStackPage() {
  const location = useLocation();
  const history = useHistory();
  const query = new URLSearchParams(location.search);
  const initialVersion = query.get('v') || versions[0];

  const [selectedVersion, setSelectedVersion] = useState(initialVersion);
  const [sections, setSections] = useState(null);
  const [prevSections, setPrevSections] = useState(null);
  const [previousVersion, setPreviousVersion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const v = new URLSearchParams(location.search).get('v') || versions[0];
    if (v !== selectedVersion) {
      setSelectedVersion(v);
    }
  }, [location.search]);

  useEffect(() => {
    function loadData() {
      setLoading(true);
      try {
        const currentData = versionDataMap[selectedVersion];
        if (!currentData) {
          throw new Error(`Version ${selectedVersion} not found`);
        }
        setSections(currentData);

        const currentIndex = versions.indexOf(selectedVersion);
        const prevV =
          currentIndex < versions.length - 1
            ? versions[currentIndex + 1]
            : null;
        setPreviousVersion(prevV);

        if (prevV) {
          const prevData = versionDataMap[prevV];
          setPrevSections(prevData || null);
        } else {
          setPrevSections(null);
        }
      } catch (error) {
        console.error('Error loading tech stack data:', error);
        setSections(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedVersion]);

  const handleVersionChange = (e) => {
    const newV = e.target.value;
    setSelectedVersion(newV);
    const newParams = new URLSearchParams(location.search);
    newParams.set('v', newV);
    history.push({ search: newParams.toString() });
  };

  const diff = useTechStackDiff(sections, prevSections, previousVersion);

  if (loading) {
    return (
      <Layout title="Tech Stack">
        <div className="container margin-vert--lg">
          <h1>Loading...</h1>
        </div>
      </Layout>
    );
  }

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
      <main className="container margin-vert--lg">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Tech Stack</h1>
            <p className={styles.subtitle}>
              Detailed information about the frameworks and libraries used in
              WaveMaker.
            </p>
          </div>
          <div className={styles.versionSelector}>
            <label htmlFor="version-select">Select Version:</label>
            <select
              id="version-select"
              value={selectedVersion}
              onChange={handleVersionChange}
              className={styles.select}
            >
              {versions.map((v) => (
                <option key={v} value={v}>
                  {formatVersion(v)}
                </option>
              ))}
            </select>
            {previousVersion && (
              <p className={styles.compareNote}>
                Comparing with <strong>{formatVersion(previousVersion)}</strong>
              </p>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <TabsWrapper>
            {visibleCategories.map(([category, subCats]) => (
              <TabItem
                key={category}
                name={category}
                count={diff.byCategory[category]}
              >
                <div className={styles.section}>
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
