import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const EquityCurveChart = ({ selectedItems, registry, normalizedData, isLog, isRebased, dateRange }) => {
  const option = useMemo(() => {
    if (!selectedItems.length) return null;

    const series = [];
    let allDates = new Set();

    selectedItems.forEach((id) => {
      const item = registry.find((r) => r.id === id);
      const data = normalizedData[id];
      if (!item || !data || data.length === 0) return;

      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);
      if (filtered.length === 0) return;

      const baseVal = isRebased ? filtered[0].value : 1;
      const rebaseMultiplier = isRebased ? 100 / baseVal : 1;

      filtered.forEach((d) => allDates.add(d.date));

      series.push({
        name: item.name,
        type: 'line',
        smooth: false,
        symbol: 'none',
        sampling: 'lttb',
        data: filtered.map((d) => [d.date, isRebased ? d.value * rebaseMultiplier : d.value]),
        lineStyle: { color: item.color, width: item.type === 'strategy' ? 2.5 : 1.8 },
        itemStyle: { color: item.color },
        z: item.type === 'strategy' ? 10 : 1,
      });
    });

    if (series.length === 0) return null;

    const sortedDates = Array.from(allDates).sort();

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
            const val = isRebased ? `${(p.value[1] - 100).toFixed(2)}%` : p.value[1].toLocaleString(undefined, { maximumFractionDigits: 0 });
            res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>${p.seriesName}</span>
              <span style="font-weight:bold;font-family:monospace">${val}</span>
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
        data: sortedDates,
        axisLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      yAxis: {
        type: isLog ? 'log' : 'value',
        min: isLog ? 'dataMin' : undefined,
        scale: true,
        axisLine: { show: false },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          formatter: isRebased ? (v) => `${(v - 100).toFixed(0)}%` : (v) => v.toLocaleString(),
        },
        splitLine: { lineStyle: { color: '#1a1c1f', type: 'dashed' } },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        {
          type: 'slider',
          backgroundColor: 'transparent',
          borderColor: '#333',
          fillerColor: 'rgba(255,255,255,0.05)',
          handleStyle: { color: '#fff', borderColor: '#666' },
          textStyle: { color: '#9ca3af' },
          bottom: 8,
          height: 24,
        },
      ],
      toolbox: {
        right: 10,
        top: -5,
        feature: {
          saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#0b0c10' },
        },
        iconStyle: { borderColor: '#6b7280' },
      },
      series,
    };
  }, [selectedItems, registry, normalizedData, isLog, isRebased, dateRange]);

  if (!option) {
    return (
      <div className="h-[450px] flex items-center justify-center text-gray-500" data-testid="equity-curve-empty">
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
