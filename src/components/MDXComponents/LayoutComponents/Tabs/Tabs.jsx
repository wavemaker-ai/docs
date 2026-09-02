import React, { useState, useId } from 'react';
import { motion } from 'framer-motion';
import './Tabs.css';

/**
 * TabItem Component
 * Used inside TabsWrapper to define individual tabs.
 *
 * Also accepts:
 * - an optional numeric `count` prop, read directly by TabsWrapper (not by
 *   TabItem itself) to show a badge next to the tab name and to decide
 *   which tab is active by default.
 * - an optional `emptyState` node, rendered instead of `children` when the
 *   tab has no meaningful content.
 * TabItem has no opinion on what it counts or what the empty state looks
 * like — that's left entirely to the caller.
 */
export function TabItem({ children, active, emptyState }) {
  // A tab is empty when every child has no content of its own (e.g. a
  // self-closing `<Accordian />` still counts as 1 child even though it
  // renders null).
  const isEmpty = React.Children.toArray(children).every(
    (child) => React.isValidElement(child) && !child.props.children,
  );

  return (
    <div
      className={`tab-pane ${active ? 'active' : ''} ${active && isEmpty && emptyState ? 'has-empty-state' : ''}`}
      style={{ display: active ? 'block' : 'none' }}
    >
      {isEmpty && emptyState ? emptyState : children}
    </div>
  );
}

/**
 * TabsWrapper Component
 * Manages the state and rendering of tabs.
 *
 * If any TabItem has a numeric `count` prop, the first tab with `count > 0`
 * is selected by default; otherwise the first tab is selected, as usual.
 */
export function TabsWrapper({ children }) {
  // Extract children and filter out non-TabItem components if necessary
  const tabs = React.Children.toArray(children).filter(
    (child) => child.props && child.props.name,
  );

  const [activeIndex, setActiveIndex] = useState(() => {
    const firstWithCount = tabs.findIndex((tab) => tab.props.count > 0);
    return firstWithCount === -1 ? 0 : firstWithCount;
  });
  const uniqueId = useId();

  if (tabs.length === 0) return null;

  const content = tabs.map((tab, index) => (
    <React.Fragment key={index}>
      {React.cloneElement(tab, { active: activeIndex === index })}
    </React.Fragment>
  ));

  return (
    <div className="tabs-wrapper">
      <div className="tabs-nav">
        {tabs.map((tab, index) => {
          const isActive = activeIndex === index;
          const { name, count } = tab.props;
          const label = count ? `${name} (${count})` : name;
          return (
            <button
              key={index}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              data-text={label}
            >
              {isActive && (
                <motion.div
                  layoutId={`active-tab-${uniqueId}`}
                  className="active-tab-bg"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="tab-btn-text">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="tab-content">{content}</div>
    </div>
  );
}
