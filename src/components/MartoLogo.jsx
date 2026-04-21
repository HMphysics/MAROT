import React from 'react';

const MarotLogo = ({ className }) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className="h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 29C6 29 9 11 15 11C21 11 21 29 21 29M19 29C19 29 22 11 28 11C34 11 34 29 34 29"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="h-8 w-px bg-gray-600"></div>
      <div className="flex flex-col justify-center">
        <span className="text-white text-sm font-serif leading-tight">
          marot
        </span>
        <span className="text-white text-sm font-serif leading-tight">
          strategies
        </span>
      </div>
    </div>
  );
};

export default MarotLogo;