import React from 'react';

export const DocsIcon = ({
  width = '1em',
  height = '1em',
  className = '',
  style = {},
}) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="8" fill="#1794EF" />
    <path
      d="M24.6671 10.7871H23.3337V9.45379C23.3337 9.28712 23.2104 9.14379 23.0437 9.12378C18.8537 8.56378 16.6937 10.0471 16.0003 10.6571C15.307 10.0471 13.147 8.56378 8.95692 9.12378C8.79025 9.14378 8.66691 9.28711 8.66691 9.45379V10.7871H7.33358C7.15024 10.7871 7.00024 10.9371 7.00024 11.1205V21.7871C7.00024 21.9705 7.15024 22.1205 7.33358 22.1205H24.6669C24.8502 22.1205 25.0002 21.9705 25.0002 21.7871V11.1205C25.0002 10.9371 24.8504 10.7871 24.6671 10.7871ZM16.3339 11.2571C16.7372 10.8738 18.6639 9.30044 22.6673 9.74712V19.7437C19.2407 19.377 17.2405 20.3937 16.3339 21.0537V11.2571ZM7.66719 21.4538V11.4538H8.66719V20.1205C8.66719 20.2171 8.70719 20.3071 8.78052 20.3705C8.85385 20.4338 8.95052 20.4638 9.04386 20.4505C12.2006 20.0305 14.1206 20.8505 15.0539 21.4538H7.66719Z"
      fill="white"
    />
  </svg>
);

export const StorybookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width="64"
    height="64"
  >
    <style>{`
    .float-ui { animation: float 3s infinite ease-in-out; transform-origin: center; }
    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); fill: #FF4785; }
      50% { transform: translateY(-3px) scale(1.05); fill: #FF73A1; } /* Slightly lighter pink for the pulse */
    }
  `}</style>
    <rect
      x="6"
      y="10"
      width="52"
      height="44"
      rx="4"
      fill="none"
      stroke="var(--ifm-color-dark, #18181B)"
      strokeWidth="4"
    />
    <line
      x1="22"
      y1="10"
      x2="22"
      y2="54"
      stroke="var(--ifm-color-dark, #18181B)"
      strokeWidth="4"
    />
    <line
      x1="12"
      y1="20"
      x2="16"
      y2="20"
      stroke="var(--ifm-color-dark, #18181B)"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="28"
      x2="16"
      y2="28"
      stroke="var(--ifm-color-dark, #18181B)"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <rect x="30" y="20" width="20" height="12" rx="3" className="float-ui" />
    <line
      x1="30"
      y1="42"
      x2="48"
      y2="42"
      stroke="var(--ifm-font-color-muted, #4A4A4A)"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

export const MarketplaceIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width="64"
    height="64"
  >
    <style>{`
    .bounce { animation: bag-bounce 2.5s infinite cubic-bezier(0.28, 0.84, 0.42, 1); transform-origin: center bottom; }
    @keyframes bag-bounce {
      0%, 100% { transform: scaleY(1) translateY(0); }
      10% { transform: scaleY(0.9) translateY(2px); }
      25% { transform: scaleY(1.05) translateY(-6px); }
      40% { transform: scaleY(1) translateY(0); }
    }
  `}</style>
    <g className="bounce">
      <path
        d="M14 24 L50 24 L54 56 L10 56 Z"
        fill="none"
        stroke="var(--ifm-color-dark, #18181B)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M24 24 V14 C24 8 40 8 40 14 V24"
        fill="none"
        stroke="var(--ifm-color-tertiary, #097FD5)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="4" fill="var(--ifm-color-tertiary, #097FD5)" />
    </g>
  </svg>
);

export const AcademyIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="8" fill="#2563EB" />
    <path
      d="M23.8503 15.1018C23.9995 15.036 24.1261 14.9279 24.2144 14.7908C24.3028 14.6538 24.3489 14.4938 24.3473 14.3307C24.3456 14.1677 24.2961 14.0087 24.2049 13.8735C24.1138 13.7383 23.985 13.6328 23.8345 13.5701L16.692 10.3168C16.4749 10.2178 16.239 10.1665 16.0003 10.1665C15.7617 10.1665 15.5258 10.2178 15.3087 10.3168L8.16699 13.5668C8.01863 13.6318 7.89242 13.7386 7.80379 13.8741C7.71517 14.0097 7.66797 14.1682 7.66797 14.3301C7.66797 14.4921 7.71517 14.6506 7.80379 14.7861C7.89242 14.9217 8.01863 15.0285 8.16699 15.0935L15.3087 18.3501C15.5258 18.4492 15.7617 18.5004 16.0003 18.5004C16.239 18.5004 16.4749 18.4492 16.692 18.3501L23.8503 15.1018Z"
      stroke="white"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24.333 14.3335V19.3335"
      stroke="white"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 16.4167V19.3333C11 19.9964 11.5268 20.6323 12.4645 21.1011C13.4021 21.5699 14.6739 21.8333 16 21.8333C17.3261 21.8333 18.5979 21.5699 19.5355 21.1011C20.4732 20.6323 21 19.9964 21 19.3333V16.4167"
      stroke="white"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SOURCE_ICONS = {
  docs: DocsIcon,
  storybook: StorybookIcon,
  marketplace: MarketplaceIcon,
  academy: AcademyIcon,
};
