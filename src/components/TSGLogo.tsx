import React from 'react';

interface TSGLogoProps {
  className?: string;
  size?: number;
}

export default function TSGLogo({ className = '', size = 48 }: TSGLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={`shrink-0 border border-black/20 font-sans ${className}`}
      style={{ minWidth: size, minHeight: size }}
    >
      {/* Dark Forest Green Background Container */}
      <rect x="0" y="0" width="100" height="100" fill="#0D4B2D" />
      
      {/* ISO 9001:2008 CERTIFIED header block (white background at the top, slightly inset) */}
      <rect x="7" y="7" width="86" height="10" fill="#FFFFFF" />
      <text 
        x="50" 
        y="14.5" 
        fill="#000000" 
        fontSize="5.5" 
        fontWeight="bold" 
        textAnchor="middle"
        letterSpacing="0.05em"
      >
        ISO 9001:2008 CERTIFIED
      </text>

      {/* Main Grid for letter columns in the middle (T S G) */}
      {/* First column: Deep Plum Purple T */}
      <rect x="7" y="19" width="28" height="60" fill="#781C5C" />
      <text 
        x="21" 
        y="58" 
        fill="#FFFFFF" 
        fontSize="34" 
        fontWeight="800" 
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        T
      </text>

      {/* Second column: Pastel Rose Pink S */}
      <rect x="36" y="19" width="28" height="60" fill="#F495A2" />
      <text 
        x="50" 
        y="58" 
        fill="#FFFFFF" 
        fontSize="34" 
        fontWeight="800" 
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        S
      </text>

      {/* Third column: Deep Plum Purple G */}
      <rect x="65" y="19" width="28" height="60" fill="#781C5C" />
      <text 
        x="79" 
        y="58" 
        fill="#FFFFFF" 
        fontSize="34" 
        fontWeight="800" 
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        G
      </text>

      {/* Underline Footer (White band for Tagline) */}
      <rect x="7" y="81" width="86" height="12" fill="#FFFFFF" />
      {/* The Fly Ash People script */}
      <text 
        x="50" 
        y="90" 
        fill="#000000" 
        fontSize="7.2" 
        fontWeight="900" 
        fontStyle="italic"
        fontFamily="serif, system-ui"
        textAnchor="middle"
      >
        The Fly Ash People
      </text>
    </svg>
  );
}
