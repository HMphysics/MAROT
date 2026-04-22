import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { calculateDrawdownSeries } from '@/lib/metricsCalculator';
import { buildUnifiedAxis } from '@/lib/chartUtils';

const GRID_COLOR = '#27272A';
const AXIS_LABEL_COLOR = '#71717A';
const TOOLTIP_BG = 'rgba(17, 17, 19, 0.96)';
const TOOLTIP_BORDER = '#27272A';

const DrawdownChart = ({ selectedItems, registry, normalizedData, dateRange }) => {
  const option = useMemo(() => {
    if (!selectedItems.length) return null;

    // 1. Calculate drawdown for each, then forward-fill on unified axis
    const ddDataMap = {};
    selectedItems.forEach((id) => {
      const data = normalizedData[id];
      if (!data || data.length === 0) return;
      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);
      const dd = calculateDrawdownSeries(filtered);
      ddDataMap[id] = dd.map((d) => ({ date: d.date, value: +(d.drawdown * 100).toFixed(2) }));
    });

    if (Object.keys(ddDataMap).length === 0) return null;

    const { dates, filled } = buildUnifiedAxis(ddDataMap);

    const series = [];
    selectedItems.forEach((id) => {
      const item = registry.find((r) => r.id === id);
      if (!item || !filled[id]) return;
      series.push({
        name: item.name,
        type: 'line',
        smooth: false,
        symbol: 'none',
        connectNulls: true,
        data: filled[id],
        lineStyle: { color: item.color, width: 1.5 },
        itemStyle: { color: item.color },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: item.color + '30' }, { offset: 1, color: item.color + '05' }],
          },
        },
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
        formatter: (params) => {
          if (!params.length) return '';
          const sorted = [...params].filter((p) => p.value != null).sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
          let res = `<div style="font-weight:600;color:#A1A1AA;margin-bottom:8px">${params[0].axisValue}</div>`;
          sorted.forEach((p) => {
            res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>${p.seriesName}</span>
              <span style="font-weight:bold;font-family:monospace">${p.value.toFixed(2)}%</span>
            </div>`;
          });
          return res;
        },
      },
      legend: { data: series.map((s) => s.name), textStyle: { color: '#A1A1AA', fontSize: 12 }, top: 0, type: 'scroll' },
      grid: { top: 40, right: 20, bottom: 60, left: 60, containLabel: true },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: GRID_COLOR } }, axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11 } },
      yAxis: { type: 'value', max: 0, axisLabel: { color: AXIS_LABEL_COLOR, formatter: '{value}%' }, splitLine: { lineStyle: { color: GRID_COLOR, type: 'dashed' } } },
      dataZoom: [{ type: 'inside' }],
      toolbox: { right: 10, top: -5, feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } }, iconStyle: { borderColor: '#52525B' } },
      series,
    };
  }, [selectedItems, registry, normalizedData, dateRange]);

  if (!option) return <div className="h-[350px] flex items-center justify-center text-zinc-500">Select items to view drawdown</div>;

  return (
    <div data-testid="drawdown-chart">
      <ReactECharts option={option} style={{ height: '350px', width: '100%' }} notMerge theme="dark" />
    </div>
  );
};

export default DrawdownChart;
