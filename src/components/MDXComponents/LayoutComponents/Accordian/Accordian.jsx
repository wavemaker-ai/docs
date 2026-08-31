import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './Accordian.css';

export const Accordian = ({ title, children, defaultOpen = false }) => {
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
        <span className="wm-accordian-title">{title}</span>
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
