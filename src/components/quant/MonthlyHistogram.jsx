import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { calculateMonthlyReturns } from '@/lib/metricsCalculator';
import { watermark } from '@/lib/chartTheme';

const MonthlyHistogram = ({ selectedItems, registry, normalizedData, dateRange }) => {
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

      const monthly = calculateMonthlyReturns(filtered);

      // Create histogram bins
      const binSize = 2; // 2% per bin
      const bins = {};
      monthly.forEach((m) => {
        const pct = m.ret * 100;
        const bin = Math.floor(pct / binSize) * binSize;
        bins[bin] = (bins[bin] || 0) + 1;
      });

      const sortedBins = Object.keys(bins)
        .map(Number)
        .sort((a, b) => a - b);

      series.push({
        name: item.name,
        type: 'bar',
        data: sortedBins.map((bin) => [bin, bins[bin]]),
        itemStyle: {
          color: item.color + 'CC',
          borderRadius: [2, 2, 0, 0],
        },
        barWidth: '60%',
      });
    });

    if (series.length === 0) return null;

    return {
      backgroundColor: 'transparent',
      graphic: [watermark],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(17, 17, 19, 0.96)',
        borderColor: '#27272A',
        textStyle: { color: '#E4E4E7' },
        formatter: (params) => {
          if (!params.length) return '';
          const bin = params[0].value[0];
          let res = `<div style="font-weight:600;color:#A1A1AA;margin-bottom:6px">${bin}% to ${bin + 2}%</div>`;
          params.forEach((p) => {
            res += `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:3px">
              <span style="color:${p.color}">${p.seriesName}</span>
              <span style="font-weight:bold">${p.value[1]} months</span>
            </div>`;
          });
          return res;
        },
      },
      legend: {
        data: series.map((s) => s.name),
        textStyle: { color: '#A1A1AA', fontSize: 12 },
        top: 0,
        type: 'scroll',
      },
      grid: { top: 40, right: 20, bottom: 40, left: 60, containLabel: true },
      xAxis: {
        type: 'category',
        axisLine: { lineStyle: { color: '#27272A' } },
        axisLabel: { color: '#71717A', formatter: '{value}%' },
        name: 'Monthly Return (%)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: '#71717A', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#71717A' },
        splitLine: { lineStyle: { color: '#27272A', type: 'dashed' } },
        name: 'Frequency',
        nameTextStyle: { color: '#71717A', fontSize: 12 },
      },
      toolbox: {
        right: 10,
        top: -5,
        feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } },
        iconStyle: { borderColor: '#52525B' },
      },
      series,
    };
  }, [selectedItems, registry, normalizedData, dateRange]);

  if (!option) {
    return <div className="h-[350px] flex items-center justify-center text-gray-500">Select items to view histogram</div>;
  }

  return (
    <div data-testid="monthly-histogram">
      <ReactECharts option={option} style={{ height: '350px', width: '100%' }} notMerge theme="dark" />
    </div>
  );
};

export default MonthlyHistogram;
