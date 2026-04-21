import React from 'react';
import { motion } from 'framer-motion';
import MetricsCard from './MetricsCard';
import { AlertCircle } from 'lucide-react';

const MetricsGrid = ({ metrics, spyMetrics, isLoading, error }) => {
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 flex items-center justify-center text-red-400 gap-3 min-h-[300px]">
        <AlertCircle className="w-6 h-6" />
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  if (isLoading || !metrics) {
      return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
              {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#0b0c10] border border-gray-800 rounded-sm p-6 animate-pulse flex flex-col justify-between">
                      <div className="h-4 w-1/3 bg-gray-800 rounded mb-4"></div>
                      <div className="h-8 w-1/2 bg-gray-800 rounded"></div>
                  </div>
              ))}
          </div>
      );
  }

  const { totalReturn, cagr, maxDrawdown, sharpeRatio, bestYear, worstYear } = metrics;

  // Format Helper
  const fmtPct = (val) => {
      if (val === undefined || val === null || isNaN(val)) return 'N/A';
      return `${(val * 100).toFixed(2)}%`;
  };

  const fmtNum = (val) => {
      if (val === undefined || val === null || isNaN(val)) return 'N/A';
      if (typeof val === 'number') return val.toFixed(2);
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed.toFixed(2);
      return val;
  };

  const displayMetrics = [
    {
      id: 'total-return',
      label: 'Total Return',
      modelValue: fmtPct(totalReturn),
      benchValue: spyMetrics ? fmtPct(spyMetrics.totalReturn) : 'N/A',
      tooltip: 'Total percentage return on investment over the full period.'
    },
    {
      id: 'cagr',
      label: 'Annualized Return (CAGR)',
      modelValue: fmtPct(cagr),
      benchValue: spyMetrics ? fmtPct(spyMetrics.cagr) : 'N/A',
      tooltip: 'Compound Annual Growth Rate.'
    },
    {
      id: 'max-drawdown',
      label: 'Max Drawdown',
      modelValue: fmtPct(maxDrawdown), 
      benchValue: spyMetrics ? fmtPct(spyMetrics.maxDrawdown) : 'N/A',
      tooltip: 'Maximum loss from peak to trough.'
    },
    {
      id: 'sharpe',
      label: 'Sharpe Ratio',
      modelValue: fmtNum(sharpeRatio),
      benchValue: spyMetrics ? fmtNum(spyMetrics.sharpeRatio) : 'N/A',
      tooltip: 'Calculated using monthly returns: (Mean Monthly Return / Monthly StdDev) * √12'
    },
    {
      id: 'best-year',
      label: 'Best Year',
      modelValue: fmtPct(bestYear),
      benchValue: spyMetrics ? fmtPct(spyMetrics.bestYear) : 'N/A',
      tooltip: 'The best performing calendar year.'
    },
    {
      id: 'worst-year',
      label: 'Worst Year',
      modelValue: fmtPct(worstYear),
      benchValue: spyMetrics ? fmtPct(spyMetrics.worstYear) : 'N/A',
      tooltip: 'The worst performing calendar year.'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayMetrics.map((metric, index) => (
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <MetricsCard metric={metric} />
        </motion.div>
      ))}
    </div>
  );
};

export default MetricsGrid;