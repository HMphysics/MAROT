import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { calculateRollingSharpe } from '@/lib/metricsCalculator';
import { buildUnifiedAxis } from '@/lib/chartUtils';

const GRID_COLOR = '#27272A';
const AXIS_LABEL_COLOR = '#71717A';
const TOOLTIP_BG = 'rgba(17, 17, 19, 0.96)';
const TOOLTIP_BORDER = '#27272A';

const RollingSharpeChart = ({ selectedItems, registry, normalizedData, dateRange }) => {
  const option = useMemo(() => {
    if (!selectedItems.length) return null;

    const rsDataMap = {};
    selectedItems.forEach((id) => {
      const data = normalizedData[id];
      if (!data || data.length === 0) return;
      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);
      const rolling = calculateRollingSharpe(filtered, 12);
      rsDataMap[id] = rolling.map((d) => ({ date: d.date, value: +d.sharpe.toFixed(3) }));
    });

    if (Object.keys(rsDataMap).length === 0) return null;

    const { dates, filled } = buildUnifiedAxis(rsDataMap);

    const series = [];
    selectedItems.forEach((id) => {
      const item = registry.find((r) => r.id === id);
      if (!item || !filled[id]) return;
      series.push({
        name: item.name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        connectNulls: true,
        data: filled[id],
        lineStyle: { color: item.color, width: 1.8 },
        itemStyle: { color: item.color },
      });
    });

    if (series.length === 0) return null;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', lineStyle: { color: '#3F3F46' }, crossStyle: { color: '#3F3F46' } },
        backgroundColor: TOOLTIP_BG,
        borderColor: TOOLTIP_BORDER,
        textStyle: { color: '#E4E4E7', fontSize: 13 },
      },
      legend: { data: series.map((s) => s.name), textStyle: { color: '#A1A1AA', fontSize: 12 }, top: 0, type: 'scroll' },
      grid: { top: 40, right: 20, bottom: 40, left: 60, containLabel: true },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: GRID_COLOR } }, axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { color: AXIS_LABEL_COLOR }, splitLine: { lineStyle: { color: GRID_COLOR, type: 'dashed' } } },
      dataZoom: [{ type: 'inside' }],
      toolbox: { right: 10, top: -5, feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } }, iconStyle: { borderColor: '#52525B' } },
      series,
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
