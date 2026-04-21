import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { calculateDrawdownSeries } from '@/lib/metricsCalculator';

const DrawdownChart = ({ selectedItems, registry, normalizedData, dateRange }) => {
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

      const dd = calculateDrawdownSeries(filtered);

      series.push({
        name: item.name,
        type: 'line',
        smooth: false,
        symbol: 'none',
        data: dd.map((d) => [d.date, +(d.drawdown * 100).toFixed(2)]),
        lineStyle: { color: item.color, width: 1.5 },
        itemStyle: { color: item.color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: item.color + '30' },
              { offset: 1, color: item.color + '05' },
            ],
          },
        },
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
        formatter: (params) => {
          if (!params.length) return '';
          let res = `<div style="font-weight:600;color:#9ca3af;margin-bottom:8px">${params[0].value[0]}</div>`;
          params.forEach((p) => {
            if (p.value[1] == null) return;
            res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>${p.seriesName}</span>
              <span style="font-weight:bold;font-family:monospace">${p.value[1].toFixed(2)}%</span>
            </div>`;
          });
          return res;
        },
      },
      legend: {
        data: series.map((s) => s.name),
        textStyle: { color: '#9ca3af', fontSize: 12 },
        top: 0,
        type: 'scroll',
      },
      grid: { top: 40, right: 20, bottom: 60, left: 60, containLabel: true },
      xAxis: {
        type: 'category',
        axisLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        max: 0,
        axisLabel: { color: '#6b7280', formatter: '{value}%' },
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
    return <div className="h-[350px] flex items-center justify-center text-gray-500">Select items to view drawdown</div>;
  }

  return (
    <div data-testid="drawdown-chart">
      <ReactECharts option={option} style={{ height: '350px', width: '100%' }} notMerge theme="dark" />
    </div>
  );
};

export default DrawdownChart;
