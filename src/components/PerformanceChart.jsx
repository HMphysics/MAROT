import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { AlertCircle } from 'lucide-react';

const PerformanceChart = ({ spyData = [], marotGrowthData = [], loading = false, error = null }) => {
  
  // Process Marot Data
  const marotSeriesData = useMemo(() => {
    if (!marotGrowthData || marotGrowthData.length === 0) return [];
    
    const sortedData = [...marotGrowthData].sort((a,b) => new Date(a.date) - new Date(b.date));
    let startValue = 100000;
    
    const firstValid = sortedData.find(item => {
        const v = item.value || item.equity || item.MarotMomentumModel2 || item.DualMomentumModel || item.UGARIT;
        return v !== undefined && v !== null && !isNaN(v);
    });

    if (firstValid) {
         startValue = firstValid.value || firstValid.equity || firstValid.MarotMomentumModel2 || firstValid.DualMomentumModel || firstValid.UGARIT;
    }

    return sortedData.map(item => {
      const date = item.date;
      const val = item.value || item.equity || item.MarotMomentumModel2 || item.DualMomentumModel || item.UGARIT;
      if (val === undefined || val === null || isNaN(val)) return [date, null];
      const normalizedValue = (val / startValue) * 100;
      return [date, normalizedValue];
    });
  }, [marotGrowthData]);

  // Process SPY Data
  const spySeriesData = useMemo(() => {
    if (!spyData || spyData.length === 0) return [];
    const startValue = spyData[0]?.value || spyData[0]?.close || 1;

    return spyData.map(d => {
        const val = d.value || d.close;
        const normalized = (val / startValue) * 100;
        return [d.date, normalized];
    });
  }, [spyData]);

  if (error) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 gap-3 p-6 text-center">
         <AlertCircle className="w-10 h-10" />
         <p className="font-semibold text-lg">Unable to load chart data</p>
         <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (!loading && marotSeriesData.length === 0) {
     return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-gray-900/30 border border-gray-800 rounded-lg text-gray-400 gap-3">
         <p>No historical data available for this strategy.</p>
      </div>
     );
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(11, 12, 16, 0.95)',
      borderColor: '#333',
      textStyle: { color: '#fff', fontSize: 13 },
      padding: [12, 16],
      formatter: function(params) {
        if (!params.length) return '';
        
        const dateObj = new Date(params[0].value[0]);
        const dateStr = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });
        
        let html = `<div style="font-weight: 600; margin-bottom: 8px; color: #9ca3af; font-size: 12px;">${dateStr}</div>`;
        
        params.forEach(param => {
          const color = param.color;
          const name = param.seriesName;
          const rawValue = param.value[1]; 
          
          if (rawValue === undefined || rawValue === null) return;
          
          const percentageReturn = rawValue - 100;
          const sign = percentageReturn > 0 ? '+' : '';
          const displayValue = `${sign}${percentageReturn.toFixed(2)}%`;

          html += `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; box-shadow: 0 0 5px ${color};"></div>
                <span style="color: #e5e7eb; font-size: 13px;">${name}</span>
              </div>
              <span style="color: #fff; font-weight: bold; font-family: monospace; font-size: 13px;">${displayValue}</span>
            </div>
          `;
        });
        return html;
      }
    },
    legend: {
      data: ['Strategy', 'SPY Benchmark'],
      top: 10, right: 10, textStyle: { color: '#9ca3af', fontSize: 12 }, itemGap: 20, icon: 'roundRect'
    },
    grid: { top: '15%', right: '3%', bottom: '10%', left: '5%', containLabel: true, show: false },
    xAxis: {
      type: 'time', boundaryGap: false,
      axisLine: { show: true, lineStyle: { color: '#333' } },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11, margin: 16, formatter: { year: '{yyyy}', month: '{MMM}', day: '{d}' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'log',
      min: 'dataMin',
      logBase: 10,
      scale: true,
      axisLine: { show: false }, 
      axisTick: { show: false },
      axisLabel: { 
          color: '#9ca3af', 
          fontSize: 11, 
          margin: 12,
          formatter: (value) => {
              const pct = value - 100;
              return `${pct.toFixed(0)}%`;
          }
      },
      splitLine: { show: true, lineStyle: { color: '#222', type: 'dashed', width: 1 } }
    },
    series: [
      {
        name: 'Strategy', type: 'line', smooth: 0, symbol: 'none', sampling: 'lttb',
        data: marotSeriesData,
        lineStyle: { color: '#FFFFFF', width: 1.5, shadowColor: 'rgba(255, 255, 255, 0.1)', shadowBlur: 2 },
        itemStyle: { color: '#FFFFFF' }, z: 10
      },
      {
        name: 'SPY Benchmark', type: 'line', smooth: 0, symbol: 'none', sampling: 'lttb',
        data: spySeriesData,
        lineStyle: { color: '#6b7280', width: 1.5, opacity: 0.8 }, 
        itemStyle: { color: '#6b7280' }, z: 1,
        markLine: { silent: true, symbol: 'none', label: { show: false },
          lineStyle: { color: '#4b5563', width: 1, type: 'dashed', opacity: 0.5 },
          data: [{ yAxis: 100 }]
        }
      }
    ]
  };

  return (
    <div className="w-full h-[500px] bg-transparent relative rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700/50">
          <div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-white/70 font-medium">Loading Data...</span>
        </div>
      )}
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  );
};

export default PerformanceChart;