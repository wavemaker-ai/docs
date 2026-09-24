import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import './Accordian.css';

// `badge`, `className`, `headerClassName`, `contentClassName`: optional
// extension points added alongside the built-in classes on the wrapper /
// header / content respectively. Accordian has no opinion on any of them.
export const Accordian = ({
  title,
  children,
  defaultOpen = false,
  badge,
  className,
  headerClassName,
  contentClassName,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!children) {
    return null;
  }

  return (
    <div
      className={`wm-accordian ${isOpen ? 'wm-accordian--open' : ''} ${className || ''}`}
    >
      <button
        type="button"
        className={`wm-accordian-header ${headerClassName || ''}`}
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
      {isOpen && (
        <div className={`wm-accordian-content ${contentClassName || ''}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordian;
