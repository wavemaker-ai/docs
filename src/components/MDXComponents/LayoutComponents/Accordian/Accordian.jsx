import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import './Accordian.css';

// `badge`, when provided, renders next to the title (e.g. an item count).
// Accordian has no opinion on what it means or how it's computed.
export const Accordian = ({ title, children, defaultOpen = false, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!children) {
    return null;
  }

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
          {badge != null && <span className="wm-accordian-count">{badge}</span>}
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
