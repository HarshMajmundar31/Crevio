import React from 'react';

export const LogoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="seg1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF9B21" />
        <stop offset="100%" stopColor="#FF5A5F" />
      </linearGradient>
      <linearGradient id="seg2Grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF5A5F" />
        <stop offset="100%" stopColor="#FF4F8F" />
      </linearGradient>
      <linearGradient id="seg3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF4F8F" />
        <stop offset="100%" stopColor="#D61B8C" />
      </linearGradient>
      <linearGradient id="seg4Grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D61B8C" />
        <stop offset="100%" stopColor="#5B007A" />
      </linearGradient>
      <linearGradient id="seg5Grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF4F8F" />
        <stop offset="100%" stopColor="#D61B8C" />
      </linearGradient>
    </defs>
    {/* Segment 1: Top-Left */}
    <path d="M 50 8 L 13.63 29 L 30.95 39 L 50 28 Z" fill="url(#seg1Grad)" />
    
    {/* Segment 2: Left Vertical */}
    <path d="M 13.63 29 L 13.63 71 L 30.95 61 L 30.95 39 Z" fill="url(#seg2Grad)" />
    
    {/* Segment 3: Bottom-Left */}
    <path d="M 13.63 71 L 50 92 L 50 72 L 30.95 61 Z" fill="url(#seg3Grad)" />
    
    {/* Segment 4: Bottom-Right */}
    <path d="M 50 92 L 86.37 71 L 69.05 61 L 50 72 Z" fill="url(#seg4Grad)" />
    
    {/* Segment 5: Floating Top-Right Parallelogram */}
    <path d="M 86.37 29 L 69.05 39 L 54.55 30.6 L 71.87 20.6 Z" fill="url(#seg5Grad)" />
  </svg>
);
