import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MetricsCard = ({ metric }) => {
  const { label, modelValue, benchValue, tooltip, id } = metric;
  
  // Standardized styling for all metrics (removed conditional Sharpe coloring)
  const modelColor = 'text-white';
  const benchColor = 'text-gray-400';

  // Helper for simple display
  const formatVal = (val) => {
    if (val === undefined || val === null || val === 'N/A') return 'N/A';
    // Values are typically already formatted strings from the parent component
    return val;
  };

  return (
    <div className="bg-[#0b0c10] border border-gray-800 rounded-sm p-6 flex flex-col justify-between h-full transition-all duration-300 hover:border-gray-600">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-gray-400 text-sm font-medium">{label}</h3>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-gray-600 hover:text-white cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 border-gray-800 text-gray-300 max-w-xs">
                <p>{tooltip}</p>
                {id === 'sharpe' && (
                  <p className="mt-2 text-xs text-gray-500 border-t border-gray-800 pt-2">
                    Risk-free rate uses historical 10-year Treasury Yields.
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Values Container */}
      <div className="flex items-end justify-between w-full">
        
        {/* Model Value */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Marot Model</span>
          <div className="relative pb-1">
            <span className={`text-3xl font-bold font-mono tracking-tight ${modelColor}`}>
              {formatVal(modelValue)}
            </span>
            <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-white`}></div>
          </div>
        </div>

        {/* Benchmark Value */}
        <div className="flex flex-col gap-2 items-end">
          <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Benchmark (SPY)</span>
          <div className="relative pb-1">
            <span className={`text-lg font-medium font-mono tracking-tight ${benchColor}`}>
              {formatVal(benchValue)}
            </span>
            <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;