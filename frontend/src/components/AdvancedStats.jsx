import React from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { generateAnnualReturns, generateDrawdownData } from '@/lib/backtestData';

const AdvancedStats = ({ strategyData, spyData }) => {
  // Use provided data if available, otherwise fallback to generators
  const annualData = (strategyData && strategyData.annualReturns) 
    ? strategyData.annualReturns 
    : generateAnnualReturns();
    
  const drawdownData = (strategyData && strategyData.drawdown) 
    ? strategyData.drawdown 
    : generateDrawdownData();

  // Annual Returns (Bar Chart) - Linear Scale is standard for mixed positive/negative values
  const annualReturnsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26, 28, 31, 0.95)',
      borderColor: '#2d3748',
      textStyle: { color: '#fff' },
      axisPointer: { type: 'shadow' },
      formatter: '{b}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: annualData.years || [],
      axisLine: { lineStyle: { color: '#2d3748' } },
      axisLabel: { color: '#718096' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2d3748' } },
      axisLabel: { color: '#718096', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#1a1c1f', type: 'dashed' } }
    },
    series: [
      {
        name: 'Annual Return',
        type: 'bar',
        data: annualData.returns || [],
        itemStyle: {
          color: (params) => {
            return params.value >= 0 ? '#00FFFF' : '#ef4444';
          },
          borderRadius: [8, 8, 0, 0]
        },
        barWidth: '60%'
      }
    ]
  };

  // Drawdown (Line/Area Chart) - Linear Scale is standard for 0 to -X values
  const drawdownOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26, 28, 31, 0.95)',
      borderColor: '#2d3748',
      textStyle: { color: '#fff' },
      formatter: function(params) {
         if(!params.length) return '';
         return `${params[0].axisValue}<br/>Drawdown: <b>${params[0].value}%</b>`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: drawdownData.dates || [],
      axisLine: { lineStyle: { color: '#2d3748' } },
      axisLabel: { color: '#718096' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2d3748' } },
      axisLabel: { color: '#718096', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#1a1c1f', type: 'dashed' } }
    },
    series: [
      {
        name: 'Drawdown',
        type: 'line',
        data: drawdownData.values || [],
        smooth: true,
        lineStyle: { color: '#ef4444', width: 2 },
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0)' }
            ]
          }
        }
      }
    ]
  };

  // Safe access for stats
  const stats = [
    { label: 'CAGR', value: strategyData?.cagr || '18.4%' },
    { label: 'Volatility', value: strategyData?.volatility || '14.2%' },
    { label: 'Sortino Ratio', value: strategyData?.sortino || '2.34' },
    { label: 'Calmar Ratio', value: strategyData?.calmar || '1.50' },
    { label: 'Max Consecutive Wins', value: strategyData?.maxWins || '8' },
    { label: 'Max Consecutive Losses', value: strategyData?.maxLosses || '4' },
    { label: 'Avg Win', value: strategyData?.avgWin || '3.2%' },
    { label: 'Avg Loss', value: strategyData?.avgLoss || '-1.8%' }
  ];

  return (
    <section className="py-20 px-4 bg-[#0b0c10]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Advanced Statistics</h2>
          <p className="text-gray-400 text-lg">Detailed performance analysis</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#1a1c1f] rounded-2xl p-6 border border-gray-800 card-glow"
          >
            <h3 className="text-xl font-semibold mb-4 text-cyan-400">Annual Returns</h3>
            <ReactECharts option={annualReturnsOption} style={{ height: '350px' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#1a1c1f] rounded-2xl p-6 border border-gray-800 card-glow"
          >
            <h3 className="text-xl font-semibold mb-4 text-red-400">Drawdown Analysis</h3>
            <ReactECharts option={drawdownOption} style={{ height: '350px' }} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-[#1a1c1f] rounded-2xl p-8 border border-gray-800 card-glow"
        >
          <h3 className="text-2xl font-semibold mb-6 text-center">Statistical Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="text-center"
              >
                <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-cyan-400">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AdvancedStats;