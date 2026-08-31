import React, { useState, useId } from 'react';
import { motion } from 'framer-motion';
import './Tabs.css';

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

/**
 * TabItem Component
 * Used inside TabsWrapper to define individual tabs.
 */
export function TabItem({ children, name, active }) {
  // A tab is empty when every Accordian child has no content of its own
  // (React.Children.count would still be 1 for `<Accordian />` even though it renders null).
  const isEmpty = React.Children.toArray(children).every(
    (child) => React.isValidElement(child) && !child.props.children,
  );
  const fallbackKey = name?.toLowerCase();
  const fallbackData = FALLBACK_DATA[fallbackKey];

  return (
    <div
      className={`tab-pane ${active ? 'active' : ''} ${active && isEmpty && fallbackData ? 'has-empty-state' : ''}`}
      style={{ display: active ? 'block' : 'none' }}
    >
      {isEmpty && fallbackData ? (
        <FallbackState data={fallbackData} />
      ) : (
        children
      )}
    </div>
  );
}

/**
 * TabsWrapper Component
 * Manages the state and rendering of tabs.
 */
export function TabsWrapper({ children }) {
  // Extract children and filter out non-TabItem components if necessary
  const tabs = React.Children.toArray(children).filter(
    (child) => child.props && child.props.name,
  );

  const [activeIndex, setActiveIndex] = useState(0);
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
          return (
            <button
              key={index}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              data-text={tab.props.name}
            >
              {isActive && (
                <motion.div
                  layoutId={`active-tab-${uniqueId}`}
                  className="active-tab-bg"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="tab-btn-text">{tab.props.name}</span>
            </button>
          );
        })}
      </div>
      <div className="tab-content">{content}</div>
    </div>
  );
}
