import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { calculateRollingSharpe } from '@/lib/metricsCalculator';

const RollingSharpeChart = ({ selectedItems, registry, normalizedData, dateRange }) => {
  const option = useMemo(() => {
    if (!selectedItems.length) return null;

    const series = [];

    selectedItems.forEach((id) => {
      const item = registry.find((r) => r.id === id);
      const data = normalizedData[id];
      if (!item || !data || data.length === 0) return;

      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);

      const rolling = calculateRollingSharpe(filtered, 12);

      series.push({
        name: item.name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: rolling.map((d) => [d.date, +d.sharpe.toFixed(3)]),
        lineStyle: { color: item.color, width: 1.8 },
        itemStyle: { color: item.color },
      });
    });

    if (series.length === 0) return null;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(11, 12, 16, 0.95)',
        borderColor: '#333',
        textStyle: { color: '#e5e7eb', fontSize: 13 },
      },
      legend: {
        data: series.map((s) => s.name),
        textStyle: { color: '#9ca3af', fontSize: 12 },
        top: 0,
        type: 'scroll',
      },
      grid: { top: 40, right: 20, bottom: 40, left: 60, containLabel: true },
      xAxis: {
        type: 'category',
        axisLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#6b7280' },
        splitLine: { lineStyle: { color: '#1a1c1f', type: 'dashed' } },
      },
      dataZoom: [{ type: 'inside' }],
      toolbox: {
        right: 10,
        top: -5,
        feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#0b0c10' } },
        iconStyle: { borderColor: '#6b7280' },
      },
      series,
    };
  }, [selectedItems, registry, normalizedData, dateRange]);

  if (!option) {
    return <div className="h-[350px] flex items-center justify-center text-gray-500">Select items to view Rolling Sharpe</div>;
  }

  return (
    <div data-testid="rolling-sharpe-chart">
      <ReactECharts option={option} style={{ height: '350px', width: '100%' }} notMerge theme="dark" />
    </div>
  );
};

export default RollingSharpeChart;
