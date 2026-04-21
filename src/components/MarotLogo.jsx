import React from 'react';

const MarotLogo = ({ className }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Elegant Cursive M Icon */}
      <svg 
        width="44" 
        height="44" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Abstract Elegant M Path - Fluid/Cursive Style */}
        <path 
          d="M15 80 C 12 70 20 25 38 25 C 48 25 50 55 50 55 C 50 55 52 25 62 25 C 80 25 88 70 85 80" 
          stroke="white" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      <span className="text-white text-xl md:text-2xl font-bold uppercase tracking-widest">
        Marot Strategies
      </span>
    </div>
  );
};

export default MarotLogo;