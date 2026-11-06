/**
 * Swizzled from @docusaurus/theme-mermaid. What differs from the original:
 * - Diagrams take their font from the site's CSS variables (SITE_CONFIG) and their colors from the
 *   rules in styles.module.css, so editing custom.css restyles them.
 * - A diagram shrinks to fit the column only down to a share of its natural size (see
 *   styles.module.css); below that its container scrolls sideways.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { ErrorBoundaryErrorMessageFallback } from '@docusaurus/theme-common';
import {
  MermaidContainerClassName,
  useMermaidConfig,
  useMermaidRenderResult,
} from '@docusaurus/theme-mermaid/client';
import styles from './styles.module.css';

// Settings that change how Mermaid sizes its boxes. They go in its config, because CSS applied
// after the render would not be measured and text would overflow its box. Mermaid cannot take
// `var()` for a color, but resolves it for the font while measuring.
const SITE_CONFIG = {
  themeVariables: {
    fontFamily: 'var(--wm-font-family)',
    fontSize: 'var(--ifm-font-size-base)',
  },
  // A box that contains other boxes gets a bold title.
  themeCSS: `
    .cluster-label .nodeLabel,
    .cluster-label p,
    .cluster-label span,
    .cluster-label text {
      font-weight: var(--wm-font-weight-semibold);
    }
  `,
  // Space around a group's title, in px: half a line of text above it, a line below.
  flowchart: { subGraphTitleMargin: { top: 8, bottom: 16 } },
};

// Mermaid sizes the SVG to the column (width: 100%, capped at its natural width). The natural width
// goes to the stylesheet, which stops the SVG shrinking below a share of it.
function naturalWidth(svg) {
  const match = svg.match(/viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)/);
  return match ? Number(match[1]) : undefined;
}

function MermaidRenderResult({ renderResult }) {
  const ref = useRef(null);
  useEffect(() => {
    const div = ref.current;
    renderResult.bindFunctions?.(div);
  }, [renderResult]);
  return (
    <div
      ref={ref}
      className={`${MermaidContainerClassName} ${styles.container}`}
      style={{ '--mermaid-natural-width': naturalWidth(renderResult.svg) }}
      dangerouslySetInnerHTML={{ __html: renderResult.svg }}
    />
  );
}

function MermaidRenderer({ value }) {
  const baseConfig = useMermaidConfig();
  const config = useMemo(
    () => ({
      ...baseConfig,
      themeVariables: {
        ...baseConfig.themeVariables,
        ...SITE_CONFIG.themeVariables,
      },
      themeCSS: [baseConfig.themeCSS, SITE_CONFIG.themeCSS]
        .filter(Boolean)
        .join('\n'),
      flowchart: { ...baseConfig.flowchart, ...SITE_CONFIG.flowchart },
    }),
    [baseConfig],
  );
  const renderResult = useMermaidRenderResult({ text: value, config });
  if (renderResult === null) {
    return null;
  }
  return <MermaidRenderResult renderResult={renderResult} />;
}

export default function Mermaid(props) {
  return (
    <ErrorBoundary
      fallback={(params) => <ErrorBoundaryErrorMessageFallback {...params} />}
    >
      <MermaidRenderer {...props} />
    </ErrorBoundary>
  );
}
