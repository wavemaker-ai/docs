import React from 'react';
import { motion } from 'framer-motion';
import MDXUl from '@theme/MDXComponents/Ul';
import { TabsWrapper, TabItem } from '../Tabs/Tabs';
import { Accordian } from '../Accordian/Accordian';
import './ReleaseNotesTabs.css';

// Release-notes-specific composition on top of the generic TabsWrapper /
// TabItem / Accordian primitives: each TabItem's badge is the sum of its
// Accordians' item counts (not the number of Accordians), the first
// Accordian with content in each tab is auto-expanded, and an empty tab
// shows release-notes-flavored copy. None of this belongs in the generic
// components, which know nothing about each other or about list-shaped
// content.

const FALLBACK_DATA = {
  features: {
    icon: '/img/icon/no-enhancements.svg',
    title: 'Waiting for the sequel.',
    description: 'No new stars today, but the current cast is killing it.',
  },
  enhancements: {
    icon: '/img/icon/no-enhancements.svg',
    title: 'Tuned to perfection.',
    description: 'We reached peak polish. For now.',
  },
  'bug fixes': {
    icon: '/img/icon/no-bugs.svg',
    title: 'No bugs to squash!',
    description: 'We looked under the rug. It’s spotless.',
  },
};

function FallbackState({ data }) {
  return (
    <motion.div
      className="empty-state-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <img src={data.icon} alt={data.title} className="empty-state-icon" />
      <h3 className="empty-state-title">{data.title}</h3>
      <p className="empty-state-text">{data.description}</p>
    </motion.div>
  );
}

function isNonEmptyAccordian(child) {
  return (
    React.isValidElement(child) &&
    child.type === Accordian &&
    child.props.children
  );
}

// Each accordion's content is either a markdown list (one <li> = one entry)
// or, for single-entry sections, a plain heading/paragraph with no list at
// all. Counting top-level <li>s (without recursing into nested lists inside
// an item) gives the entry count without hardcoding per-file.
function getAccordianItemCount(children) {
  let itemCount = 0;
  let sawList = false;

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === MDXUl) {
      sawList = true;
      itemCount += React.Children.toArray(child.props.children).filter(
        React.isValidElement,
      ).length;
    }
  });

  return sawList ? itemCount : 1;
}

// Clones each non-empty Accordian with its item-count badge and, for the
// first one, auto-expand — computing each accordian's count exactly once
// and returning the running total for the tab's own badge.
function withCountsAndAutoExpand(children) {
  let firstAccordianSeen = false;
  let tabCount = 0;

  const content = React.Children.map(children, (child) => {
    if (!isNonEmptyAccordian(child)) return child;

    const itemCount = getAccordianItemCount(child.props.children);
    tabCount += itemCount;

    const isFirst = !firstAccordianSeen;
    firstAccordianSeen = true;

    return React.cloneElement(child, {
      badge: child.props.badge ?? itemCount,
      defaultOpen: child.props.defaultOpen ?? isFirst,
    });
  });

  return { content, count: tabCount };
}

export function ReleaseNotesTabs({ children }) {
  const tabs = React.Children.toArray(children).map((tab) => {
    if (!React.isValidElement(tab) || tab.type !== TabItem) return tab;

    const { content, count } = withCountsAndAutoExpand(tab.props.children);
    const fallbackData = FALLBACK_DATA[tab.props.name?.toLowerCase()];

    return React.cloneElement(tab, {
      count,
      children: content,
      emptyState: fallbackData ? (
        <FallbackState data={fallbackData} />
      ) : undefined,
    });
  });

  return <TabsWrapper>{tabs}</TabsWrapper>;
}

export default ReleaseNotesTabs;
