import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { calculateRollingSharpe } from '@/lib/metricsCalculator';

const GRID_COLOR = '#27272A';
const AXIS_LABEL_COLOR = '#71717A';
const TOOLTIP_BG = 'rgba(17, 17, 19, 0.96)';
const TOOLTIP_BORDER = '#27272A';

const RollingSharpeChart = ({ selectedItems, registry, normalizedData, dateRange }) => {
  const option = useMemo(() => {
    if (!selectedItems.length) return null;

    const echartsSeries = [];

    selectedItems.forEach((id) => {
      const item = registry.find((r) => r.id === id);
      const data = normalizedData[id];
      if (!item || !data || data.length === 0) return;

      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);
      if (filtered.length === 0) return;

      const rolling = calculateRollingSharpe(filtered, 12);
      if (rolling.length === 0) return;

      echartsSeries.push({
        name: item.name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: rolling.map((d) => [d.date, +d.sharpe.toFixed(3)]),
        lineStyle: { color: item.color, width: 1.8 },
        itemStyle: { color: item.color },
      });
    });

    if (echartsSeries.length === 0) return null;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#3F3F46' } },
        backgroundColor: TOOLTIP_BG,
        borderColor: TOOLTIP_BORDER,
        textStyle: { color: '#E4E4E7', fontSize: 13 },
        formatter: (params) => {
          if (!params.length) return '';
          const valid = params.filter((p) => p.value && p.value[1] != null);
          if (valid.length === 0) return '';
          const sorted = [...valid].sort((a, b) => (b.value[1] ?? 0) - (a.value[1] ?? 0));
          let res = `<div style="font-weight:600;color:#A1A1AA;margin-bottom:8px">${sorted[0].value[0]}</div>`;
          sorted.forEach((p) => {
            res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>${p.seriesName}</span>
              <span style="font-weight:bold;font-family:monospace">${p.value[1].toFixed(2)}</span>
            </div>`;
          });
          return res;
        },
      },
      legend: { data: echartsSeries.map((s) => s.name), textStyle: { color: '#A1A1AA', fontSize: 12 }, top: 0, type: 'scroll' },
      grid: { top: 40, right: 20, bottom: 40, left: 60, containLabel: true },
      xAxis: { type: 'time', axisLine: { lineStyle: { color: GRID_COLOR } }, axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11 }, splitLine: { show: false } },
      yAxis: { type: 'value', axisLabel: { color: AXIS_LABEL_COLOR }, splitLine: { lineStyle: { color: GRID_COLOR, type: 'dashed' } } },
      dataZoom: [{ type: 'inside' }],
      toolbox: { right: 10, top: -5, feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } }, iconStyle: { borderColor: '#52525B' } },
      series: echartsSeries,
    };
  }, [selectedItems, registry, normalizedData, dateRange]);

  if (!option) return <div className="h-[350px] flex items-center justify-center text-zinc-500">Select items to view Rolling Sharpe</div>;

  return (
    <div data-testid="rolling-sharpe-chart">
      <ReactECharts option={option} style={{ height: '350px', width: '100%' }} notMerge theme="dark" />
    </div>
  );
};

export default RollingSharpeChart;
