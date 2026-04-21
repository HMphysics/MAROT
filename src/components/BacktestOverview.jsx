import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Award, BarChart3, Activity } from 'lucide-react';

const BacktestOverview = ({ strategyData, strategyName = "Strategy" }) => {
  const metrics = [
    {
      title: 'Total Return',
      value: `${strategyData.TotalReturn?.toFixed(2) || '0.00'}%`,
      icon: TrendingUp,
      color: 'from-cyan-400 to-blue-500'
    },
    {
      title: 'Annualized Return (CAGR)',
      value: `${strategyData.CAGR?.toFixed(2) || '0.00'}%`,
      icon: Award,
      color: 'from-green-400 to-emerald-500'
    },
    {
      title: 'Max Drawdown',
      value: `${strategyData.MaxDrawdown?.toFixed(2) || '0.00'}%`,
      icon: TrendingDown,
      color: 'from-red-400 to-pink-500'
    },
    {
      title: 'Sharpe Ratio',
      value: strategyData.SharpeRatio?.toFixed(2) || '0.00',
      icon: Target,
      color: 'from-purple-400 to-indigo-500'
    },
    {
      title: 'Win Rate',
      value: `${strategyData.WinRate?.toFixed(1) || '0.0'}%`,
      icon: Activity,
      color: 'from-cyan-400 to-teal-500'
    },
    {
      title: 'End Balance',
      value: `$${strategyData.EndBalance?.toLocaleString('en-US') || '0'}`,
      icon: BarChart3,
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#0b0c10] relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4">{strategyName} Results</h2>
          <p className="text-gray-400 text-lg">Key performance metrics</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-[#1a1c1f] rounded-2xl p-6 border border-gray-800 card-glow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <h3 className="text-gray-400 text-sm mb-2">{metric.title}</h3>
              <p className="text-4xl font-bold text-white">{metric.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BacktestOverview;