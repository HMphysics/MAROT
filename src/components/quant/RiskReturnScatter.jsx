import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const RiskReturnScatter = ({ selectedItems, registry, metricsMap }) => {
  const option = useMemo(() => {
    if (!selectedItems.length) return null;

    const dataPoints = [];
    selectedItems.forEach((id) => {
      const item = registry.find((r) => r.id === id);
      const m = metricsMap[id];
      if (!item || !m) return;
      dataPoints.push({
        name: item.name,
        value: [+(m.vol * 100).toFixed(2), +(m.cagr * 100).toFixed(2)],
        itemStyle: { color: item.color },
        symbolSize: item.type === 'strategy' ? 18 : 14,
      });
    });

    if (dataPoints.length === 0) return null;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (p) =>
          `<div style="font-weight:600;color:#fff">${p.name}</div>
           <div style="margin-top:4px;color:#9ca3af">Vol: ${p.value[0]}% | CAGR: ${p.value[1]}%</div>`,
        backgroundColor: 'rgba(17, 17, 19, 0.96)',
        borderColor: '#27272A',
        textStyle: { color: '#E4E4E7' },
      },
      grid: { top: 20, right: 30, bottom: 50, left: 60, containLabel: true },
      xAxis: {
        name: 'Annualized Volatility (%)',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: { color: '#71717A', fontSize: 12 },
        axisLabel: { color: '#71717A', formatter: '{value}%' },
        axisLine: { lineStyle: { color: '#27272A' } },
        splitLine: { lineStyle: { color: '#27272A', type: 'dashed' } },
      },
      yAxis: {
        name: 'CAGR (%)',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: { color: '#71717A', fontSize: 12 },
        axisLabel: { color: '#71717A', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#27272A', type: 'dashed' } },
      },
      toolbox: {
        right: 10,
        top: -5,
        feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } },
        iconStyle: { borderColor: '#52525B' },
      },
      series: [
        {
          type: 'scatter',
          data: dataPoints,
          label: {
            show: true,
            formatter: (p) => p.name,
            position: 'top',
            color: '#A1A1AA',
            fontSize: 11,
          },
        },
      ],
    };
  }, [selectedItems, registry, metricsMap]);

  if (!option) {
    return <div className="h-[350px] flex items-center justify-center text-gray-500">Select items to view scatter</div>;
  }

  return (
    <div data-testid="risk-return-scatter">
      <ReactECharts option={option} style={{ height: '350px', width: '100%' }} notMerge theme="dark" />
    </div>
  );
};

export default RiskReturnScatter;
