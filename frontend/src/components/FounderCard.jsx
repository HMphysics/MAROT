import React from 'react';
import { User } from 'lucide-react';

const FounderCard = ({ name, title }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-900/10 group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center border border-blue-800/30 group-hover:border-blue-500/50 transition-colors">
          <User className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{name}</h3>
          <p className="text-sm text-gray-400 uppercase tracking-wider">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default FounderCard;