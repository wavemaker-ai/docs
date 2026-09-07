import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './AIConverstion.module.css';
import { SOURCE_ICONS } from './SourceIcons';

// ── Video modal dialog ────────────────────────────────────────
function VideoModal({ url, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div className={styles.videoModalOverlay} onClick={onClose}>
      <div
        className={styles.videoModalBox}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.videoModalClose}
          onClick={onClose}
          aria-label="Close video"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <iframe
          src={url}
          allowFullScreen
          className={styles.videoModalIframe}
          title="Academy Video Player"
        />
      </div>
    </div>,
    document.body,
  );
}

const getPlatform = (meta) => {
  const p = meta?.path || meta?.url_path || '';
  if (p.includes('/mobile/')) return 'mobile';
  if (p.includes('/web/')) return 'web';
  return null;
};

const resolveUrl = (url, source) => {
  if (!url) return '#';
  if (source !== 'docs') return url;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/docs/${url}`;
};

const SOURCE_ORDER = { docs: 1, academy: 2, storybook: 3, marketplace: 4 };

const SOURCE_LABELS = {
  docs: 'DOCS',
  academy: 'ACADEMY',
  storybook: 'STORYBOOK',
  marketplace: 'MARKETPLACE',
};

const SOURCE_COLORS = {
  docs: '#1b7be4',
  academy: '#433fed',
  storybook: '#ff4785',
  marketplace: '#097fd5',
};

// ── Chevron icon ─────────────────────────────────────────────
function ChevronIcon({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── DOCS: flat link list ──────────────────────────────────────
function DocLinkList({ groups }) {
  return (
    <div className={styles.docLinkList}>
      {groups.map((group) =>
        group.chunks.map((chunk, ci) => {
          const href = resolveUrl(chunk.meta?.url_path || chunk.url, 'docs');
          const label = chunk.meta?.section_title || chunk.title || 'Section';
          const isFirst = ci === 0;
          return (
            <a
              key={`${group.id}-${ci}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.docLink} ${isFirst && ci === 0 && groups.indexOf(group) === 0 ? styles.docLinkActive : ''}`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.docLinkIcon}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className={styles.docLinkText}>{label}</span>
            </a>
          );
        }),
      )}
    </div>
  );
}

// ── STORYBOOK: component card + doc sections ─────────────────
// Order the component's doc pages the way its Storybook sidebar reads.
const SECTION_ORDER = [
  'overview',
  'props',
  'events',
  'methods',
  'styling',
  'style',
  'token',
];

const sectionRank = (section) => {
  const index = SECTION_ORDER.indexOf(section);
  return index === -1 ? SECTION_ORDER.length : index;
};

const titleCase = (value) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

// Chunks are raw markdown — mostly prop tables and code samples. Show the first
// line that reads as prose, and nothing at all when there isn't one.
const proseLine = (text) => {
  if (!text) return '';
  const line = text
    .split('\n')
    .map((l) =>
      l
        .replace(/^[#>\s*-]+/, '')
        .replace(/[`*_]/g, '')
        .trim(),
    )
    .find(
      (l) =>
        l.length > 24 &&
        l.includes(' ') &&
        /^[A-Za-z]/.test(l) &&
        !/[|=<>{}]/.test(l),
    );
  return line ? line.slice(0, 90) : '';
};

function StorybookComponentCard({ group }) {
  const firstChunk = group.chunks[0];
  const category = firstChunk?.meta?.category || '';
  // Chunk URLs carry a #section fragment so fusion keeps them apart; the header
  // links to the component's page itself.
  const storyUrl = firstChunk?.meta?.story_url || group.url;

  // One row per doc section — the same section can arrive as several chunks,
  // and chunks are already ranked, so the first one wins.
  const sections = [];
  group.chunks.forEach((chunk) => {
    const section = chunk.meta?.section;
    if (!section || sections.some((row) => row.section === section)) return;
    sections.push({
      section,
      label: chunk.meta?.section_title || titleCase(section),
      hint: proseLine(chunk.excerpt),
      href: chunk.url || storyUrl,
    });
  });
  sections.sort((a, b) => sectionRank(a.section) - sectionRank(b.section));

  return (
    <div className={styles.componentCard}>
      <a
        className={styles.componentCardHeader}
        href={storyUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className={styles.componentCardInfo}>
          <span className={styles.componentCardTitle}>{group.title}</span>
          {category && (
            <span className={styles.componentCardCategory}>{category}</span>
          )}
        </div>
        {storyUrl && (
          <span className={styles.componentCardOpen}>
            Storybook
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17 17 7" />
              <path d="M8 7h9v9" />
            </svg>
          </span>
        )}
      </a>

      {sections.map((row) => (
        <a
          key={row.section}
          href={row.href || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.componentSectionRow}
        >
          <span className={styles.componentSectionTag}>{row.label}</span>
          {row.hint ? (
            <span className={styles.componentSectionHint}>{row.hint}</span>
          ) : (
            <span className={styles.componentSectionSpacer} />
          )}
          <span className={styles.componentSectionOpen} aria-hidden="true">
            ↗
          </span>
        </a>
      ))}
    </div>
  );
}

// ── MARKETPLACE: artifact card + actions ─────────────────────
function MarketplaceArtifactCard({ group }) {
  const meta = group.chunks[0]?.meta || {};
  const detailUrl = meta.detail_url || group.url;
  // Description and capabilities restate each other, so show one: the summary
  // when there is one, otherwise the capability list standing in for it.
  const description = meta.description?.trim();
  const capabilities = description
    ? []
    : (meta.features?.length ? meta.features : meta.tags || [])
        .filter((item) => item && String(item).trim())
        .slice(0, 2);
  const actions = [
    meta.preview_url && { label: 'Preview', href: meta.preview_url },
    meta.github_url && { label: 'GitHub', href: meta.github_url },
  ].filter(Boolean);

  return (
    <div className={styles.artifactCard}>
      <a
        className={styles.artifactCardBody}
        href={detailUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className={styles.artifactCardHeader}>
          <div className={styles.artifactThumbnail}>
            {meta.thumbnail ? (
              <img
                src={meta.thumbnail}
                alt=""
                className={styles.artifactThumbnailImg}
                loading="lazy"
              />
            ) : (
              <span className={styles.artifactThumbnailFallback}>
                {group.title.charAt(0)}
              </span>
            )}
          </div>
          <div className={styles.artifactCardInfo}>
            <span className={styles.artifactCardTitle}>{group.title}</span>
            <span className={styles.artifactCardMetaRow}>
              {meta.artifact_type && (
                <span className={styles.artifactTypeTag}>
                  {titleCase(meta.artifact_type)}
                </span>
              )}
              {meta.version && (
                <span className={styles.artifactCardVersion}>
                  v{meta.version}
                </span>
              )}
            </span>
          </div>
        </div>

        {description && (
          <p className={styles.artifactCardDescription}>{description}</p>
        )}

        {capabilities.length > 0 && (
          <ul className={styles.artifactCapabilities}>
            {capabilities.map((capability, ci) => (
              <li key={ci} className={styles.artifactCapability}>
                {capability}
              </li>
            ))}
          </ul>
        )}
      </a>

      {(meta.published_by || actions.length > 0) && (
        <div className={styles.artifactCardFooter}>
          {meta.published_by && (
            <span className={styles.artifactPublisher}>
              {meta.published_icon && (
                <img
                  src={meta.published_icon}
                  alt=""
                  className={styles.artifactPublisherAvatar}
                  loading="lazy"
                />
              )}
              {meta.published_by}
            </span>
          )}
          {actions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.artifactAction}
            >
              {action.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ACADEMY: video card + timestamps ─────────────────────────
function AcademyVideoCard({ group, onVideoOpen }) {
  const firstChunk = group.chunks[0];
  const previewRows = firstChunk?.meta?.segment_previews;
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const rows =
    Array.isArray(previewRows) && previewRows.length > 0
      ? previewRows.map((preview, idx) => ({
          id: `${group.id}-preview-${idx}`,
          timeBadge: preview.display_time,
          label:
            preview.title ||
            firstChunk?.meta?.segment_title ||
            firstChunk?.meta?.section_title ||
            group.title ||
            'Section',
          href: resolveUrl(
            preview.url || firstChunk?.meta?.url_path || firstChunk?.url,
            'academy',
          ),
          timestamp:
            preview.timestamp_seconds ??
            firstChunk?.meta?.timestamp_seconds ??
            firstChunk?.meta?.start_seconds ??
            firstChunk?.meta?.start_timestamp,
          thumbnail: preview.thumbnail,
        }))
      : group.chunks.map((chunk, idx) => ({
          id: `${group.id}-chunk-${idx}`,
          timeBadge: chunk.meta?.display_time,
          label:
            chunk.meta?.segment_title ||
            chunk.meta?.section_title ||
            chunk.title ||
            'Section',
          href: resolveUrl(chunk.meta?.url_path || chunk.url, 'academy'),
          timestamp:
            chunk.meta?.timestamp_seconds ??
            chunk.meta?.start_seconds ??
            chunk.meta?.start_timestamp,
        }));

  const defaultThumbnail =
    rows.find((row) => row.thumbnail)?.thumbnail ||
    firstChunk?.meta?.segment_previews?.[0]?.thumbnail ||
    firstChunk?.meta?.video_thumbnail;

  // Use hovered row's thumbnail if available, otherwise default
  const activeIndex = hoveredIndex !== null ? hoveredIndex : 0;
  const thumbnailSrc = rows[activeIndex]?.thumbnail || defaultThumbnail;

  const duration = firstChunk?.meta?.duration_minutes;
  const durationLabel = duration ? `${duration} mins` : null;

  const buildEmbedUrl = (chunk, withTimestamp = true) => {
    if (!chunk?.meta?.embed_link) return null;
    try {
      const base =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://academy.wavemaker.ai';
      const url = new URL(chunk.meta.embed_link, base);
      if (withTimestamp) {
        const timestamp =
          chunk.meta?.timestamp_seconds ??
          chunk.meta?.start_seconds ??
          chunk.meta?.start_timestamp;
        if (timestamp !== undefined && timestamp !== null && timestamp !== '') {
          url.searchParams.set('t', String(timestamp));
        }
      }
      return url.toString();
    } catch {
      let url = chunk.meta.embed_link;
      if (withTimestamp) {
        const timestamp =
          chunk.meta?.timestamp_seconds ??
          chunk.meta?.start_seconds ??
          chunk.meta?.start_timestamp;
        if (timestamp !== undefined && timestamp !== null && timestamp !== '') {
          const separator = url.includes('?') ? '&' : '?';
          if (!/[?&]t=/.test(url)) {
            url += `${separator}t=${timestamp}`;
          }
        }
      }
      return url;
    }
  };

  const handleThumbnailPlay = () => {
    const url = buildEmbedUrl(firstChunk, false);
    if (url) onVideoOpen(url);
  };

  const handleTimestampPlay = (e, timestamp) => {
    const chunk = {
      ...firstChunk,
      meta: {
        ...(firstChunk?.meta || {}),
        start_timestamp: timestamp,
        start_seconds: timestamp,
        timestamp_seconds: timestamp,
      },
    };
    const url = buildEmbedUrl(chunk, true);
    if (url) {
      e.preventDefault();
      onVideoOpen(url);
    }
  };

  const hasThumbnailPlay = !!firstChunk?.meta?.embed_link;

  return (
    <div className={styles.academyCard}>
      {/* Horizontal header: thumbnail + title/duration */}
      <div className={styles.academyCardHeader}>
        <div
          className={`${styles.academyThumbnail} ${hasThumbnailPlay ? styles.academyThumbnailClickable : ''}`}
          onClick={hasThumbnailPlay ? handleThumbnailPlay : undefined}
          role={hasThumbnailPlay ? 'button' : undefined}
          tabIndex={hasThumbnailPlay ? 0 : undefined}
          onKeyDown={
            hasThumbnailPlay
              ? (e) => e.key === 'Enter' && handleThumbnailPlay()
              : undefined
          }
          aria-label={hasThumbnailPlay ? `Play ${group.title}` : undefined}
        >
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={group.title}
              className={styles.academyThumbnailImg}
            />
          ) : (
            <div className={styles.academyThumbnailPlaceholder}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon
                  points="5 3 19 12 5 21 5 3"
                  fill="white"
                  opacity="0.9"
                />
              </svg>
            </div>
          )}
          {/* Play overlay on thumbnail */}
          <div className={styles.academyPlayOverlay}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
        <div className={styles.academyCardInfo}>
          <span className={styles.academyCardTitle}>{group.title}</span>
          {durationLabel && (
            <span className={styles.academyCardDuration}>{durationLabel}</span>
          )}
        </div>
      </div>

      {/* Timestamps */}
      {rows.map((row, idx) => (
        <a
          key={row.id}
          href={row.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.academyTimestampRow} ${(hoveredIndex !== null ? hoveredIndex === idx : idx === 0) ? styles.academyTimestampRowActive : ''}`}
          onClick={(e) => handleTimestampPlay(e, row.timestamp)}
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {row.timeBadge && (
            <span className={styles.timestampTag}>{row.timeBadge}</span>
          )}
          <span className={styles.academyTimestampLabel}>{row.label}</span>
          <span className={styles.academyPlayBtn}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Play
          </span>
        </a>
      ))}
    </div>
  );
}

// ── Per-source accordion section ──────────────────────────────
const SOURCE_RENDERERS = {
  storybook: (group) => <StorybookComponentCard key={group.id} group={group} />,
  marketplace: (group) => (
    <MarketplaceArtifactCard key={group.id} group={group} />
  ),
};

function SourceSection({ source, groups, defaultOpen, onVideoOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const IconComponent = SOURCE_ICONS[source] || SOURCE_ICONS.docs;
  const color = SOURCE_COLORS[source] || '#6b7280';
  const isAcademy = source === 'academy';
  const renderGroup = SOURCE_RENDERERS[source];

  return (
    <div className={styles.sourceSection}>
      <button
        className={styles.sourceSectionHeader}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <div
          className={styles.sourceSectionIcon}
          style={{ background: `${color}18`, color }}
        >
          <IconComponent width="14" height="14" />
        </div>
        <span className={styles.sourceSectionLabel}>
          {SOURCE_LABELS[source] || source.toUpperCase()}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className={styles.sourceSectionContent}>
          {isAcademy ? (
            groups.map((group) => (
              <AcademyVideoCard
                key={group.id}
                group={group}
                onVideoOpen={onVideoOpen}
              />
            ))
          ) : renderGroup ? (
            groups.map(renderGroup)
          ) : (
            <DocLinkList groups={groups} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Main SourceCards export ───────────────────────────────────
export default function SourceCards({ cards, activeQuestion, isLoading }) {
  const scrollRef = useRef(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [cards]);

  // Group by parent_doc_id within each source
  const bySource = {};
  cards.forEach((card) => {
    const src = card.source || 'docs';
    if (!bySource[src]) bySource[src] = {};
    const parentId =
      card.meta?.parent_doc_id ||
      card.url ||
      `fallback-${card.title}-${Math.random()}`;
    if (!bySource[src][parentId]) {
      bySource[src][parentId] = {
        id: parentId,
        source: src,
        title: card.title || 'Source',
        url: card.url,
        platform: getPlatform(card.meta),
        chunks: [],
      };
    }
    bySource[src][parentId].chunks.push(card);
  });

  // Sorted sources
  const sortedSources = Object.keys(bySource).sort(
    (a, b) => (SOURCE_ORDER[a] || 99) - (SOURCE_ORDER[b] || 99),
  );

  const navHeader = (
    <div className={styles.sourcesNavHeader}>
      <div className={styles.sourcesNavTop}>
        <span className={styles.sourcesNavLabel}>SOURCES</span>
      </div>
      {activeQuestion && (
        <div className={styles.sourcesNavQuestion}>{activeQuestion}</div>
      )}
    </div>
  );

  if (cards.length === 0) {
    return (
      <div className={styles.sourcesCol}>
        {navHeader}
        <div
          className={`${styles.sourcesColScroll} ${styles.sourcesColCenter}`}
          ref={scrollRef}
        >
          {isLoading ? (
            <div className={styles.sourcesLoadingState}>
              <div className={styles.sourcesSpinner} />
              <span className={styles.sourcesLoadingText}>
                Gathering sources…
              </span>
            </div>
          ) : (
            <div className={styles.sourcesEmpty}>
              Sources will appear here after you ask a question.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sourcesCol}>
      {navHeader}
      <div className={styles.sourcesColScroll} ref={scrollRef}>
        {sortedSources.map((source, si) => {
          const groups = Object.values(bySource[source]);
          // Open the top-ranked sources; the rest stay one click away.
          const defaultOpen = si < 2;
          return (
            <SourceSection
              key={source}
              source={source}
              groups={groups}
              defaultOpen={defaultOpen}
              onVideoOpen={setActiveVideoUrl}
            />
          );
        })}
      </div>
      {activeVideoUrl && (
        <VideoModal
          url={activeVideoUrl}
          onClose={() => setActiveVideoUrl(null)}
        />
      )}
    </div>
  );
}
