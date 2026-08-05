import React from 'react';
import { Monitor, Server, Layers, Palette } from 'lucide-react';
import './Pills.css';

const WebIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg
    width={size}
    height={(size * 11) / 12}
    viewBox="0 0 12 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 1.5C12 1.10218 11.842 0.720644 11.5607 0.43934C11.2794 0.158035 10.8978 0 10.5 0H1.5C1.10218 0 0.720644 0.158035 0.43934 0.43934C0.158035 0.720644 0 1.10218 0 1.5L0 8.75C0 9.14782 0.158035 9.52936 0.43934 9.81066C0.720644 10.092 1.10218 10.25 1.5 10.25H10.5C10.8978 10.25 11.2794 10.092 11.5607 9.81066C11.842 9.52936 12 9.14782 12 8.75V1.5ZM4.825 1C4.86984 0.927645 4.93241 0.867936 5.00679 0.82653C5.08116 0.785124 5.16488 0.763391 5.25 0.763391C5.33512 0.763391 5.41884 0.785124 5.49321 0.82653C5.56759 0.867936 5.63016 0.927645 5.675 1C5.72382 1.07424 5.74984 1.16115 5.74984 1.25C5.74984 1.33885 5.72382 1.42576 5.675 1.5C5.63016 1.57236 5.56759 1.63206 5.49321 1.67347C5.41884 1.71488 5.33512 1.73661 5.25 1.73661C5.16488 1.73661 5.08116 1.71488 5.00679 1.67347C4.93241 1.63206 4.86984 1.57236 4.825 1.5C4.77618 1.42576 4.75016 1.33885 4.75016 1.25C4.75016 1.16115 4.77618 1.07424 4.825 1ZM3.075 1C3.11984 0.927645 3.18241 0.867936 3.25679 0.82653C3.33116 0.785124 3.41488 0.763391 3.5 0.763391C3.58512 0.763391 3.66884 0.785124 3.74321 0.82653C3.81759 0.867936 3.88016 0.927645 3.925 1C3.97382 1.07424 3.99984 1.16115 3.99984 1.25C3.99984 1.33885 3.97382 1.42576 3.925 1.5C3.88016 1.57236 3.81759 1.63206 3.74321 1.67347C3.66884 1.71488 3.58512 1.73661 3.5 1.73661C3.41488 1.73661 3.33116 1.71488 3.25679 1.67347C3.18241 1.63206 3.11984 1.57236 3.075 1.5C3.02618 1.42576 3.00016 1.33885 3.00016 1.25C3.00016 1.16115 3.02618 1.07424 3.075 1ZM1.295 1.045C1.33362 0.96326 1.39369 0.893521 1.4688 0.843205C1.5439 0.79289 1.63125 0.76388 1.72154 0.759263C1.81183 0.754646 1.90168 0.774594 1.98153 0.816986C2.06138 0.859378 2.12824 0.922626 2.175 1C2.22382 1.07424 2.24984 1.16115 2.24984 1.25C2.24984 1.33885 2.22382 1.42576 2.175 1.5C2.13016 1.57236 2.06759 1.63206 1.99321 1.67347C1.91884 1.71488 1.83512 1.73661 1.75 1.73661C1.66488 1.73661 1.58116 1.71488 1.50679 1.67347C1.43241 1.63206 1.36984 1.57236 1.325 1.5C1.27831 1.42478 1.25242 1.3385 1.25 1.25C1.25195 1.17944 1.26721 1.10989 1.295 1.045ZM11 8.75C11 8.88261 10.9473 9.00979 10.8536 9.10355C10.7598 9.19732 10.6326 9.25 10.5 9.25H1.5C1.36739 9.25 1.24021 9.19732 1.14645 9.10355C1.05268 9.00979 1 8.88261 1 8.75V2.625C1 2.59185 1.01317 2.56005 1.03661 2.53661C1.06005 2.51317 1.09185 2.5 1.125 2.5H10.875C10.9082 2.5 10.9399 2.51317 10.9634 2.53661C10.9868 2.56005 11 2.59185 11 2.625V8.75Z"
      fill={color}
    />
  </svg>
);

const MobileIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.5 0H3.5C3.10218 0 2.72064 0.158035 2.43934 0.43934C2.15804 0.720644 2 1.10218 2 1.5V10.5C2 10.8978 2.15804 11.2794 2.43934 11.5607C2.72064 11.842 3.10218 12 3.5 12H8.5C8.89782 12 9.27936 11.842 9.56066 11.5607C9.84196 11.2794 10 10.8978 10 10.5V1.5C10 1.10218 9.84196 0.720644 9.56066 0.43934C9.27936 0.158035 8.89782 0 8.5 0ZM6 11.235C5.90111 11.235 5.80444 11.2057 5.72221 11.1507C5.63999 11.0958 5.5759 11.0177 5.53806 10.9263C5.50022 10.835 5.49031 10.7344 5.50961 10.6375C5.5289 10.5405 5.57652 10.4514 5.64645 10.3814C5.71637 10.3115 5.80546 10.2639 5.90245 10.2446C5.99945 10.2253 6.09998 10.2352 6.19134 10.2731C6.2827 10.3109 6.36079 10.375 6.41573 10.4572C6.47067 10.5394 6.5 10.6361 6.5 10.735C6.5 10.8676 6.44732 10.9948 6.35355 11.0886C6.25978 11.1823 6.13261 11.235 6 11.235ZM9 9C9 9.13261 8.94732 9.25979 8.85355 9.35355C8.75979 9.44732 8.63261 9.5 8.5 9.5H3.5C3.36739 9.5 3.24021 9.44732 3.14645 9.35355C3.05268 9.25979 3 9.13261 3 9V1.765C3 1.63239 3.05268 1.50521 3.14645 1.41145C3.24021 1.31768 3.36739 1.265 3.5 1.265H8.5C8.63261 1.265 8.75979 1.31768 8.85355 1.41145C8.94732 1.50521 9 1.63239 9 1.765V9Z"
      fill={color}
    />
  </svg>
);

const pillConfig = {
  web: { icon: WebIcon, label: 'Web' },
  mobile: { icon: MobileIcon, label: 'Mobile' },
  desktop: { icon: Monitor, label: 'Desktop' },
  android: { icon: MobileIcon, label: 'Android' },
  ios: { icon: MobileIcon, label: 'iOS' },
  backend: { icon: Server, label: 'Backend' },
  platform: { icon: Layers, label: 'Platform' },
  design: { icon: Palette, label: 'Design' },
  beta: { icon: null, label: 'Beta' },
  langgraph: { icon: null, label: 'LangGraph' },
  rag: { icon: null, label: 'Agentic RAG' },
  mcp: { icon: null, label: 'MCP Architecture' },
  langfuse: { icon: null, label: 'LangFuse' },
  ai: { icon: null, label: 'Production AI' },
  ragas: { icon: null, label: 'RAGAS' },
  'golden-datasets': { icon: null, label: 'Golden Datasets' },
  sdd: { icon: null, label: 'Spec Driven Development' },
  figma: { icon: null, label: 'Figma' },
  'design-system': { icon: null, label: 'Design System' },
};

export function PillGroup({ children }) {
  return <div className="wm-pill-group">{children}</div>;
}

export function StatPill({ label, description, color }) {
  return (
    <div className="wm-stat-pill-row">
      <span className="wm-stat-pill" data-color={color}>
        {label}
      </span>
      <span className="wm-stat-pill-desc">{description}</span>
    </div>
  );
}

export function StatPills({ children }) {
  return <div className="wm-stat-pills">{children}</div>;
}

export function Pill({ type, text, icon: CustomIcon, children }) {
  const key = type?.trim().toLowerCase();
  const preset = pillConfig[key] || {};
  const IconComponent = CustomIcon || preset.icon;
  const displayText = text || preset.label || children || type;

  const typeClass =
    key && pillConfig[key] ? `wm-pill-${key}` : 'wm-pill-default';

  return (
    <span className={`wm-pill ${typeClass}`}>
      {IconComponent && (
        <span className="wm-pill-icon">
          <IconComponent
            size={14}
            strokeWidth={2.5}
            color="var(--wm-pill-icon-color, currentColor)"
          />
        </span>
      )}
      {displayText && <span className="wm-pill-text">{displayText}</span>}
    </span>
  );
}
