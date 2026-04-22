import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { calculateDrawdownSeries } from '@/lib/metricsCalculator';
import { buildUnifiedAxis } from '@/lib/chartUtils';
import { GRID_COLOR, AXIS_LABEL_COLOR, TOOLTIP_BG, TOOLTIP_BORDER, watermark } from '@/lib/chartTheme';

const DrawdownChart = ({ selectedItems, registry, normalizedData, dateRange }) => {
  const option = useMemo(() => {
    if (!selectedItems.length) return null;

    // Compute drawdown per series
    const ddDataMap = {};
    selectedItems.forEach((id) => {
      const data = normalizedData[id];
      if (!data || data.length === 0) return;
      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);
      if (filtered.length === 0) return;
      const dd = calculateDrawdownSeries(filtered);
      ddDataMap[id] = dd.map((d) => ({ date: d.date, value: +(d.drawdown * 100).toFixed(2) }));
    });

    if (Object.keys(ddDataMap).length === 0) return null;

    // Unified axis with forward-fill
    const { dates, filled } = buildUnifiedAxis(ddDataMap);

    const echartsSeries = [];
    selectedItems.forEach((id) => {
      const item = registry.find((r) => r.id === id);
      if (!item || !filled[id]) return;

      const seriesData = [];
      for (let i = 0; i < dates.length; i++) {
        const v = filled[id][i];
        if (v !== null) seriesData.push([dates[i], v]);
      }
      if (seriesData.length === 0) return;

      echartsSeries.push({
        name: item.name,
        type: 'line',
        smooth: false,
        symbol: 'none',
        data: seriesData,
        lineStyle: { color: item.color, width: 1.5 },
        itemStyle: { color: item.color },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: item.color + '30' }, { offset: 1, color: item.color + '05' }],
          },
        },
      });
    });

    if (echartsSeries.length === 0) return null;

    return {
      backgroundColor: 'transparent',
      graphic: [watermark],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', snap: true, lineStyle: { color: '#3F3F46' } },
        backgroundColor: TOOLTIP_BG,
        borderColor: TOOLTIP_BORDER,
        textStyle: { color: '#E4E4E7', fontSize: 13 },
        formatter: (params) => {
          if (!params.length) return '';
          const valid = params.filter((p) => p.value && p.value[1] != null);
          if (valid.length === 0) return '';
          const sorted = [...valid].sort((a, b) => (a.value[1] ?? 0) - (b.value[1] ?? 0));
          let res = `<div style="font-weight:600;color:#A1A1AA;margin-bottom:8px">${sorted[0].value[0]}</div>`;
          sorted.forEach((p) => {
            res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>${p.seriesName}</span>
              <span style="font-weight:bold;font-family:monospace">${p.value[1].toFixed(2)}%</span>
            </div>`;
          });
          return res;
        },
      },
      legend: { data: echartsSeries.map((s) => s.name), textStyle: { color: '#A1A1AA', fontSize: 12 }, top: 0, type: 'scroll' },
      grid: { top: 40, right: 20, bottom: 60, left: 60, containLabel: true },
      xAxis: { type: 'time', axisLine: { lineStyle: { color: GRID_COLOR } }, axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11 }, splitLine: { show: false } },
      yAxis: { type: 'value', max: 0, axisLabel: { color: AXIS_LABEL_COLOR, formatter: '{value}%' }, splitLine: { lineStyle: { color: GRID_COLOR, type: 'dashed' } } },
      dataZoom: [{ type: 'inside' }],
      toolbox: { right: 10, top: -5, feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } }, iconStyle: { borderColor: '#52525B' } },
      series: echartsSeries,
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
