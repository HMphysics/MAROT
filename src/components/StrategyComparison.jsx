import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const StrategyComparison = ({ strategy1Data, strategy2Data, strategy1Name, strategy2Name }) => {
  const compareMetric = (val1, val2, higherIsBetter = true) => {
    if (val1 === undefined || val1 === null || val2 === undefined || val2 === null) {
      return { icon: Minus, color: 'text-gray-500', text: 'neutral', diff: null };
    }

    const diff = val1 - val2;
    if (Math.abs(diff) < 0.01) return { icon: Minus, color: 'text-gray-500', text: 'neutral' };
    const isPositive = higherIsBetter ? diff > 0 : diff < 0;
    
    return {
      icon: isPositive ? ArrowUp : ArrowDown,
      color: isPositive ? 'text-white' : 'text-gray-500', 
      text: isPositive ? 'outperforming' : 'underperforming',
      diff: Math.abs(diff).toFixed(2)
    };
  };

  const safeFormat = (value, formatter) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    return formatter(value);
  };

  const metrics = [
    {
      label: 'Total Return',
      value1: strategy1Data?.TotalReturn,
      value2: strategy2Data?.TotalReturn,
      format: (v) => `${v.toFixed(2)}%`,
      higherIsBetter: true
    },
    {
      label: 'CAGR',
      value1: strategy1Data?.CAGR,
      value2: strategy2Data?.CAGR,
      format: (v) => `${v.toFixed(2)}%`,
      higherIsBetter: true
    },
    {
      label: 'Sharpe Ratio',
      value1: strategy1Data?.SharpeRatio,
      value2: strategy2Data?.SharpeRatio,
      format: (v) => v.toFixed(2),
      higherIsBetter: true
    },
    {
      label: 'Max Drawdown',
      value1: strategy1Data?.MaxDrawdown,
      value2: strategy2Data?.MaxDrawdown,
      format: (v) => `${v.toFixed(2)}%`,
      higherIsBetter: false
    },
    {
      label: 'Win Rate',
      value1: strategy1Data?.WinRate,
      value2: strategy2Data?.WinRate,
      format: (v) => `${v.toFixed(1)}%`,
      higherIsBetter: true
    },
    {
      label: 'End Balance',
      value1: strategy1Data?.EndBalance,
      value2: strategy2Data?.EndBalance,
      format: (v) => `$${v.toLocaleString('en-US')}`,
      higherIsBetter: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => {
        const comparison = compareMetric(metric.value1, metric.value2, metric.higherIsBetter);
        const Icon = comparison.icon;

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-[#0b0c10] rounded-sm p-6 border border-gray-800 hover:border-gray-600 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm text-gray-400 font-medium">{metric.label}</h3>
              <Icon className={`w-4 h-4 ${comparison.color}`} />
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">{strategy1Name}</div>
                <div className="text-2xl font-bold text-white font-mono">
                  {safeFormat(metric.value1, metric.format)}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-3">
                <div className="text-xs text-gray-500 mb-1">{strategy2Name}</div>
                <div className="text-lg font-semibold text-gray-500 font-mono">
                  {safeFormat(metric.value2, metric.format)}
                </div>
              </div>

              {comparison.diff && (
                <div className={`text-xs ${comparison.color} font-medium pt-1`}>
                  {comparison.diff} {metric.label === 'Sharpe Ratio' ? 'points' : metric.label === 'Win Rate' ? 'pp' : '%'} {comparison.text}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StrategyComparison;