import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { buildUnifiedAxis } from '@/lib/chartUtils';
import { GRID_COLOR, AXIS_LABEL_COLOR, TOOLTIP_BG, TOOLTIP_BORDER, watermark } from '@/lib/chartTheme';

const EquityCurveChart = ({ selectedItems, registry, normalizedData, isLog, isRebased, dateRange }) => {
  const option = useMemo(() => {
    if (!selectedItems.length) return null;

    // 1. Filter each series by dateRange
    const rawFiltered = {};
    selectedItems.forEach((id) => {
      const data = normalizedData[id];
      if (!data || data.length === 0) return;
      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);
      if (filtered.length > 0) rawFiltered[id] = filtered;
    });

    if (Object.keys(rawFiltered).length === 0) return null;

    // 2. Determine common rebase date (latest first-date across selected)
    let commonStart = null;
    for (const data of Object.values(rawFiltered)) {
      const first = data[0].date;
      if (!commonStart || first > commonStart) commonStart = first;
    }

    // 3. Transform values based on mode
    const transformed = {};
    for (const [id, data] of Object.entries(rawFiltered)) {
      let baseVal;
      if (isRebased) {
        const bp = data.find((p) => p.date >= commonStart);
        baseVal = bp ? bp.value : data[0].value;
        if (!baseVal || baseVal === 0) baseVal = 1;
        transformed[id] = data.map((d) => ({ date: d.date, value: (d.value / baseVal) * 100 }));
      } else {
        baseVal = data[0].value;
        if (!baseVal || baseVal === 0) baseVal = 1;
        transformed[id] = data.map((d) => ({ date: d.date, value: ((d.value / baseVal) - 1) * 100 }));
      }
    }

    // 4. Build unified axis with forward-fill (stops at each series' last date)
    const { dates, filled } = buildUnifiedAxis(transformed);

    // 5. Build ECharts series — use [dateString, value] pairs on time axis
    //    so lines end naturally when data ends (null → no point drawn)
    const echartsSeries = [];
    selectedItems.forEach((id) => {
      const item = registry.find((r) => r.id === id);
      if (!item || !filled[id]) return;

      const seriesData = [];
      for (let i = 0; i < dates.length; i++) {
        const v = filled[id][i];
        if (v !== null) seriesData.push([dates[i], +v.toFixed(4)]);
      }
      if (seriesData.length === 0) return;

      echartsSeries.push({
        name: item.name,
        type: 'line',
        smooth: false,
        symbol: 'none',
        data: seriesData,
        lineStyle: { color: item.color, width: item.type === 'strategy' ? 2.5 : 1.8 },
        itemStyle: { color: item.color },
        z: item.type === 'strategy' ? 10 : 1,
      });
    });

    if (echartsSeries.length === 0) return null;

    const yAxisName = isRebased ? 'Value (base 100)' : 'Cumulative return (%)';
    const yFormatter = isRebased ? (v) => v.toFixed(0) : (v) => `${v.toFixed(0)}%`;
    const titleSubtext = isRebased && commonStart ? `Base: ${commonStart}` : '';

    return {
      backgroundColor: 'transparent',
      graphic: [watermark],
      title: titleSubtext ? {
        text: titleSubtext,
        left: 60, top: 8,
        textStyle: { color: '#52525B', fontSize: 11, fontWeight: 'normal', fontFamily: 'monospace' },
      } : undefined,
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
          const sorted = [...valid].sort((a, b) => (b.value[1] ?? 0) - (a.value[1] ?? 0));
          const dateStr = sorted[0].value[0];
          let res = `<div style="font-weight:600;color:#A1A1AA;margin-bottom:8px">${dateStr}</div>`;
          sorted.forEach((p) => {
            const v = p.value[1];
            const val = isRebased ? v.toFixed(2) : `${v.toFixed(2)}%`;
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
        textStyle: { color: '#A1A1AA', fontSize: 12 }, top: 0, type: 'scroll',
      },
      grid: { top: titleSubtext ? 50 : 40, right: 20, bottom: 60, left: 60, containLabel: true },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: GRID_COLOR } },
        axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: isLog ? 'log' : 'value',
        name: yAxisName, nameLocation: 'middle', nameGap: 50,
        nameTextStyle: { color: '#52525B', fontSize: 11 },
        min: isLog ? 'dataMin' : undefined, scale: true,
        axisLine: { show: false },
        axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11, formatter: yFormatter },
        splitLine: { lineStyle: { color: GRID_COLOR, type: 'dashed' } },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', backgroundColor: 'transparent', borderColor: '#27272A',
          fillerColor: 'rgba(255,255,255,0.04)',
          handleStyle: { color: '#71717A', borderColor: '#52525B' },
          textStyle: { color: '#71717A' }, bottom: 8, height: 24 },
      ],
      toolbox: {
        right: 10, top: -5,
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
