import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import MDXUl from '@theme/MDXComponents/Ul';
import './Accordian.css';

// Each accordion's content is either a markdown list (one <ul> item = one
// entry) or, for single-entry sections, a plain heading/paragraph with no
// list at all. Counting top-level <li>s (without recursing into nested
// lists inside an item) gives the entry count without hardcoding per-file.
export function getAccordianItemCount(children) {
  if (!children) return 0;

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

export const Accordian = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!children) {
    return null;
  }

  const itemCount = getAccordianItemCount(children);

  return (
    <div className={`wm-accordian ${isOpen ? 'wm-accordian--open' : ''}`}>
      <button
        type="button"
        className="wm-accordian-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="wm-accordian-title">
          {title}
          <span className="wm-accordian-count">{itemCount}</span>
        </span>
        <span
          className={`wm-accordian-icon ${isOpen ? 'wm-accordian-icon--open' : ''}`}
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </span>
      </button>
      {isOpen && <div className="wm-accordian-content">{children}</div>}
    </div>
  );
};

export default Accordian;
