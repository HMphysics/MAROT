import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { buildUnifiedAxis } from '@/lib/chartUtils';

const GRID_COLOR = '#27272A';
const AXIS_LABEL_COLOR = '#71717A';
const TOOLTIP_BG = 'rgba(17, 17, 19, 0.96)';
const TOOLTIP_BORDER = '#27272A';

const EquityCurveChart = ({ selectedItems, registry, normalizedData, isLog, isRebased, dateRange }) => {
  const option = useMemo(() => {
    if (!selectedItems.length) return null;

    // 1. Gather & filter series data per selection
    const seriesDataMap = {};
    selectedItems.forEach((id) => {
      const data = normalizedData[id];
      if (!data || data.length === 0) return;
      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);
      if (filtered.length === 0) return;

      if (isRebased) {
        const baseVal = filtered[0].value;
        if (baseVal === 0) return;
        seriesDataMap[id] = filtered.map((d) => ({ date: d.date, value: (d.value / baseVal) * 100 }));
      } else {
        seriesDataMap[id] = filtered;
      }
    });

    if (Object.keys(seriesDataMap).length === 0) return null;

    // 2. Build unified X-axis with forward-fill
    const { dates, filled } = buildUnifiedAxis(seriesDataMap);

    // 3. Build ECharts series
    const echartsSeries = [];
    selectedItems.forEach((id) => {
      const item = registry.find((r) => r.id === id);
      if (!item || !filled[id]) return;
      echartsSeries.push({
        name: item.name,
        type: 'line',
        smooth: false,
        symbol: 'none',
        sampling: 'lttb',
        connectNulls: true,
        data: filled[id],
        lineStyle: { color: item.color, width: item.type === 'strategy' ? 2.5 : 1.8 },
        itemStyle: { color: item.color },
        z: item.type === 'strategy' ? 10 : 1,
      });
    });

    if (echartsSeries.length === 0) return null;

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
          const sorted = [...params].filter((p) => p.value != null).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
          let res = `<div style="font-weight:600;color:#A1A1AA;margin-bottom:8px">${params[0].axisValue}</div>`;
          sorted.forEach((p) => {
            const val = isRebased
              ? `${(p.value - 100).toFixed(2)}%`
              : p.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
            res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>${p.seriesName}</span>
              <span style="font-weight:bold;font-family:monospace">${val}</span>
            </div>`;
          });
          return res;
        },
      },
      legend: {
        data: echartsSeries.map((s) => s.name),
        textStyle: { color: '#A1A1AA', fontSize: 12 },
        top: 0,
        type: 'scroll',
      },
      grid: { top: 40, right: 20, bottom: 60, left: 60, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: GRID_COLOR } },
        axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11 },
      },
      yAxis: {
        type: isLog ? 'log' : 'value',
        min: isLog ? 'dataMin' : undefined,
        scale: true,
        axisLine: { show: false },
        axisLabel: {
          color: AXIS_LABEL_COLOR,
          fontSize: 11,
          formatter: isRebased ? (v) => `${(v - 100).toFixed(0)}%` : (v) => v.toLocaleString(),
        },
        splitLine: { lineStyle: { color: GRID_COLOR, type: 'dashed' } },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        {
          type: 'slider',
          backgroundColor: 'transparent',
          borderColor: '#27272A',
          fillerColor: 'rgba(255,255,255,0.04)',
          handleStyle: { color: '#71717A', borderColor: '#52525B' },
          textStyle: { color: '#71717A' },
          bottom: 8,
          height: 24,
        },
      ],
      toolbox: {
        right: 10,
        top: -5,
        feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } },
        iconStyle: { borderColor: '#52525B' },
      },
      series: echartsSeries,
    };
  }, [selectedItems, registry, normalizedData, isLog, isRebased, dateRange]);

  if (!option) {
    return (
      <div className="h-[450px] flex items-center justify-center text-zinc-500" data-testid="equity-curve-empty">
        Select at least one strategy or benchmark
      </div>
    );
  }

  return (
    <div data-testid="equity-curve-chart">
      <ReactECharts option={option} style={{ height: '450px', width: '100%' }} notMerge theme="dark" />
    </div>
  );
};

export default EquityCurveChart;
