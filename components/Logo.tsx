import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Meta Mind Crypto Logo"
    role="img"
  >
    <defs>
      <linearGradient id="icon-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <g>
      <path d="M12 2 L5 7 v10 l7 5 7-5 V7 L12 2 Z" stroke="url(#icon-gradient)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 10 H 17 L 16 14 H 8 Z" fill="url(#icon-gradient)" />
      <path d="M9 16 H 15 M10 18 H 14" stroke="url(#icon-gradient)" strokeWidth="1" strokeLinecap="round" />
    </g>
  </svg>
);

export default Logo;
