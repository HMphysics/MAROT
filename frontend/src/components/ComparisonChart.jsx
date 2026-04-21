import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';

const ComparisonChart = ({ portfolioData, strategyName = "Marot Momentum Model 2" }) => {
  const chartOption = useMemo(() => {
    // Base 100 initialization for Log Scale
    const initialBalance = 10000;
    const dates = portfolioData.map(d => d.date);
    
    const strategyKey = strategyName === "Marot Momentum Model 2" ? 'MarotMomentumModel2' : 'DualMomentumModel';
    
    // Normalize to Base 100 (100 = 0% return)
    const strategyData = portfolioData.map(d => 
      (d[strategyKey] / initialBalance) * 100
    );
    const vanguardData = portfolioData.map(d => 
      (d.Vanguard500 / initialBalance) * 100
    );

    return {
      backgroundColor: 'transparent',
      grid: { top: 70, right: 50, bottom: 90, left: 80 },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(11, 12, 16, 0.95)',
        borderColor: '#374151',
        borderWidth: 1,
        textStyle: { color: '#e5e7eb' },
        formatter: (params) => {
          const date = new Date(params[0].axisValue).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          let tooltip = `<div style="font-size: 14px; font-weight: 600; color: #f3f4f6; margin-bottom: 8px;">${date}</div>`;
          params.forEach(param => {
            // Convert Base 100 back to Percentage Return
            const pctReturn = param.value - 100;
            const sign = pctReturn > 0 ? '+' : '';
            
            tooltip += `<div style="display: flex; align-items: center; margin-top: 6px;">
              <span style="display:inline-block;margin-right:8px;border-radius:50%;width:10px;height:10px;background-color:${param.color};"></span>
              <span style="color: #d1d5db; flex: 1; font-size: 13px;">${param.seriesName}</span>
              <span style="font-weight: bold; color: #fff; margin-left: 16px; font-size: 14px;">${sign}${pctReturn.toFixed(2)}%</span>
            </div>`;
          });
          return tooltip;
        }
      },
      legend: { 
        data: [strategyName, 'Vanguard 500 Index'], 
        top: 10,
        left: 'left',
        textStyle: { color: '#9ca3af', fontSize: 13 },
        icon: 'rect',
        itemWidth: 14,
        itemHeight: 14,
        itemGap: 24,
      },
      xAxis: { 
        type: 'category', 
        data: dates,
        axisLine: { show: true, lineStyle: { color: '#404040' } },
        axisTick: { show: false },
        axisLabel: { 
          color: '#808080',
          fontSize: 11,
          formatter: (value) => new Date(value).getFullYear().toString()
        }
      },
      yAxis: { 
        type: 'log', // Logarithmic
        min: 'dataMin',
        scale: true,
        axisLine: { show: false },
        axisLabel: { 
          color: '#808080',
          fontSize: 11,
          // Format Base 100 to Percentage
          formatter: (value) => `${(value - 100).toFixed(0)}%` 
        },
        splitLine: { 
          show: true,
          lineStyle: { color: '#282828', type: 'dashed' } 
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          backgroundColor: 'transparent',
          borderColor: '#404040',
          fillerColor: 'rgba(255, 255, 255, 0.08)',
          dataBackground: {
            lineStyle: { color: 'transparent' },
            areaStyle: { color: 'transparent' }
          },
          selectedDataBackground: {
            lineStyle: { color: '#f0f0f0' },
            areaStyle: { color: 'rgba(240, 240, 240, 0.15)' }
          },
          handleStyle: {
            color: '#fff',
            borderColor: '#ccc'
          },
          moveHandleStyle: {
            color: '#fff',
            opacity: 0.7
          },
          textStyle: {
            color: '#9ca3af'
          },
          bottom: 25,
          height: 28,
        }
      ],
      series: [
        { 
          name: strategyName,
          type: 'line',
          smooth: true,
          data: strategyData,
          lineStyle: { color: '#00FFFF', width: 3 },
          symbol: 'none',
          emphasis: {
            focus: 'series',
            lineStyle: { width: 3.5 }
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 255, 255, 0.25)' },
                { offset: 1, color: 'rgba(0, 255, 255, 0)' }
              ]
            }
          }
        },
        { 
          name: 'Vanguard 500 Index',
          type: 'line',
          smooth: true,
          data: vanguardData,
          lineStyle: { color: '#909090', width: 2.5 },
          symbol: 'none',
          emphasis: {
            focus: 'series',
            lineStyle: { width: 3 }
          }
        }
      ]
    };
  }, [portfolioData, strategyName]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-[#0b0c10] rounded-xl p-6 md:p-8 border border-gray-800"
    >
      <ReactECharts 
        option={chartOption} 
        style={{ height: '520px' }} 
        notMerge={true} 
        lazyUpdate={true} 
      />
    </motion.div>
  );
};

export default ComparisonChart;