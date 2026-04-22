import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { calculateMonthlyReturns } from '@/lib/metricsCalculator';
import { watermark } from '@/lib/chartTheme';

/**
 * Compute pairwise Pearson correlation between monthly returns of all selected series.
 */
function computeCorrelationMatrix(selectedItems, registry, normalizedData, dateRange) {
  // 1. Get monthly returns for each series, keyed by YYYY-MM
  const monthlyMaps = {};
  for (const id of selectedItems) {
    const data = normalizedData[id];
    if (!data || data.length === 0) continue;
    let filtered = data;
    if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
    if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);

    const monthly = calculateMonthlyReturns(filtered);
    const map = new Map();
    for (const m of monthly) {
      const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, m.ret);
    }
    monthlyMaps[id] = map;
  }

  // 2. Compute pairwise correlation on overlapping months
  const ids = selectedItems.filter((id) => monthlyMaps[id]);
  const n = ids.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(null));

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) { matrix[i][j] = 1; continue; }

      const mapA = monthlyMaps[ids[i]];
      const mapB = monthlyMaps[ids[j]];
      const aligned = [];
      for (const [key, retA] of mapA) {
        if (mapB.has(key)) aligned.push({ a: retA, b: mapB.get(key) });
      }

      if (aligned.length < 3) { matrix[i][j] = null; matrix[j][i] = null; continue; }

      const meanA = aligned.reduce((s, p) => s + p.a, 0) / aligned.length;
      const meanB = aligned.reduce((s, p) => s + p.b, 0) / aligned.length;
      let cov = 0, varA = 0, varB = 0;
      for (const p of aligned) {
        cov += (p.a - meanA) * (p.b - meanB);
        varA += (p.a - meanA) ** 2;
        varB += (p.b - meanB) ** 2;
      }
      const denom = Math.sqrt(varA * varB);
      const corr = denom === 0 ? 0 : cov / denom;
      matrix[i][j] = +corr.toFixed(4);
      matrix[j][i] = +corr.toFixed(4);
    }
  }

  return { ids, matrix };
}

const CorrelationHeatmap = ({ selectedItems, registry, normalizedData, dateRange }) => {
  const option = useMemo(() => {
    if (selectedItems.length < 2) return null;

    const { ids, matrix } = computeCorrelationMatrix(selectedItems, registry, normalizedData, dateRange);
    if (ids.length < 2) return null;

    const names = ids.map((id) => {
      const item = registry.find((r) => r.id === id);
      return item ? item.name : id;
    });

    // ECharts heatmap data: [col, row, value]
    const data = [];
    let min = 1, max = -1;
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        const v = matrix[i][j];
        if (v !== null) {
          data.push([j, i, v]);
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }

    return {
      backgroundColor: 'transparent',
      graphic: [watermark],
      tooltip: {
        position: 'top',
        backgroundColor: 'rgba(17, 17, 19, 0.96)',
        borderColor: '#27272A',
        textStyle: { color: '#E4E4E7', fontSize: 13 },
        formatter: (p) => {
          if (p.value[2] == null) return '';
          return `<div style="font-weight:600;color:#A1A1AA;margin-bottom:4px">${names[p.value[1]]} vs ${names[p.value[0]]}</div>
            <div style="font-size:18px;font-weight:bold;font-family:monospace;color:${p.value[2] > 0.7 ? '#34D399' : p.value[2] < 0.3 ? '#F87171' : '#E4E4E7'}">${p.value[2].toFixed(3)}</div>
            <div style="color:#71717A;font-size:11px;margin-top:2px">${p.value[1] === p.value[0] ? '' : Math.abs(p.value[2]) > 0.7 ? 'Highly correlated' : Math.abs(p.value[2]) < 0.3 ? 'Low correlation' : 'Moderate correlation'}</div>`;
        },
      },
      grid: { top: 10, right: 30, bottom: 80, left: 120, containLabel: false },
      xAxis: {
        type: 'category',
        data: names,
        position: 'bottom',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#A1A1AA', fontSize: 11, rotate: 35, interval: 0 },
        splitArea: { show: false },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#A1A1AA', fontSize: 11, interval: 0 },
        splitArea: { show: false },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#EF4444', '#78716C', '#22C55E'],
        },
        textStyle: { color: '#71717A', fontSize: 11 },
        text: ['+1.0', '-1.0'],
      },
      toolbox: {
        right: 10, top: -5,
        feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } },
        iconStyle: { borderColor: '#52525B' },
      },
      series: [{
        type: 'heatmap',
        data,
        label: {
          show: true,
          formatter: (p) => p.value[2] != null ? p.value[2].toFixed(2) : '',
          color: '#E4E4E7',
          fontSize: 11,
          fontFamily: 'monospace',
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' },
        },
        itemStyle: {
          borderColor: '#111113',
          borderWidth: 2,
          borderRadius: 3,
        },
      }],
    };
  }, [selectedItems, registry, normalizedData, dateRange]);

  if (!option) {
    return (
      <div className="h-[400px] flex items-center justify-center text-zinc-500" data-testid="correlation-empty">
        Select at least 2 strategies/benchmarks to see correlations
      </div>
    );
  }

  // Dynamic height based on number of items
  const count = selectedItems.length;
  const height = Math.max(350, count * 55 + 120);

  return (
    <div data-testid="correlation-heatmap">
      <ReactECharts option={option} style={{ height: `${height}px`, width: '100%' }} notMerge theme="dark" />
    </div>
  );
};

export default CorrelationHeatmap;
