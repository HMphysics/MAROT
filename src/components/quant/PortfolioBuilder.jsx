import React, { useState, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { Plus, X, Link2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { registry } from '@/data/registry';
import { normalizeSeries } from '@/lib/seriesNormalizer';
import { simulatePortfolio } from '@/lib/portfolioBuilder';
import { watermark } from '@/lib/chartTheme';
import { useToast } from '@/components/ui/use-toast';

const PORTFOLIO_COLOR = '#06B6D4';
const MAX_COMPONENTS = 10;

const fmtPct = (v) => (v != null && isFinite(v)) ? `${(v * 100).toFixed(2)}%` : '-';
const fmtNum = (v, d = 2) => (v != null && isFinite(v)) ? v.toFixed(d) : '-';
const fmtDays = (v) => (v != null && isFinite(v)) ? `${v}d` : '-';

const REBALANCE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'never', label: 'Never (buy & hold)' },
];

const PortfolioBuilder = ({ normalizedData }) => {
  const { toast } = useToast();
  const [components, setComponents] = useState([
    { id: '', weight: '' },
    { id: '', weight: '' },
  ]);
  const [rebalanceFreq, setRebalanceFreq] = useState('monthly');
  const [isLog, setIsLog] = useState(false);
  const [isRebased, setIsRebased] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const totalWeight = components.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
  const weightStatus = totalWeight === 100 ? 'ok' : totalWeight > 100 ? 'over' : 'under';
  const validComponents = components.filter((c) => c.id && parseFloat(c.weight) > 0);
  const canCalculate = weightStatus === 'ok' && validComponents.length >= 1;

  const addComponent = () => {
    if (components.length < MAX_COMPONENTS) {
      setComponents([...components, { id: '', weight: '' }]);
    }
  };

  const removeComponent = (idx) => {
    setComponents(components.filter((_, i) => i !== idx));
  };

  const updateComponent = (idx, field, value) => {
    const updated = [...components];
    updated[idx] = { ...updated[idx], [field]: value };
    setComponents(updated);
  };

  const autoBalance = () => {
    const filled = components.filter((c) => c.id);
    if (filled.length === 0) return;
    const w = +(100 / filled.length).toFixed(2);
    setComponents(components.map((c) => c.id ? { ...c, weight: String(w) } : c));
  };

  const handleCalculate = useCallback(() => {
    setError('');
    const comps = validComponents.map((c) => ({
      id: c.id,
      weight: parseFloat(c.weight),
      data: normalizedData[c.id] || [],
    }));

    const result = simulatePortfolio({ components: comps, rebalanceFreq });

    if (result.error) {
      setError(result.error);
      return;
    }

    setResults(result);

    // Persist to URL
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'portfolio-builder');
    params.set('pb_components', comps.map((c) => `${c.id}:${c.weight}`).join(','));
    params.set('pb_rebalance', rebalanceFreq);
    if (isLog) params.set('pb_log', '1');
    if (!isRebased) params.set('pb_rebased', '0');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [validComponents, rebalanceFreq, normalizedData, isLog, isRebased]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied', description: 'Portfolio configuration URL copied to clipboard.' });
  };

  // Chart options
  const equityOption = useMemo(() => {
    if (!results) return null;
    const series = [];

    // Individual components at reduced opacity
    validComponents.forEach((comp, i) => {
      const item = registry.find((r) => r.id === comp.id);
      if (!item || !results.componentCurves[i]) return;
      const curve = results.componentCurves[i];
      series.push({
        name: item.name,
        type: 'line', smooth: false, symbol: 'none',
        data: curve.map((p) => [p.date, isRebased ? p.value : ((p.value / curve[0].value) - 1) * 100]),
        lineStyle: { color: item.color, width: 1.2, opacity: 0.4 },
        itemStyle: { color: item.color },
        z: 1,
      });
    });

    // Portfolio line — prominent
    const eq = results.equityCurve;
    series.push({
      name: 'My Portfolio',
      type: 'line', smooth: false, symbol: 'none',
      data: eq.map((p) => [p.date, isRebased ? p.value : ((p.value / 100) - 1) * 100]),
      lineStyle: { color: PORTFOLIO_COLOR, width: 3 },
      itemStyle: { color: PORTFOLIO_COLOR },
      z: 10,
    });

    return {
      backgroundColor: 'transparent', graphic: [watermark],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', snap: true, lineStyle: { color: '#3F3F46' } },
        backgroundColor: 'rgba(17,17,19,0.96)', borderColor: '#27272A',
        textStyle: { color: '#E4E4E7', fontSize: 13 },
        formatter: (params) => {
          const valid = params.filter((p) => p.value?.[1] != null);
          if (!valid.length) return '';
          const sorted = [...valid].sort((a, b) => (b.value[1] ?? 0) - (a.value[1] ?? 0));
          let res = `<div style="font-weight:600;color:#A1A1AA;margin-bottom:8px">${sorted[0].value[0]}</div>`;
          sorted.forEach((p) => {
            const v = isRebased ? p.value[1].toFixed(2) : `${p.value[1].toFixed(2)}%`;
            res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>${p.seriesName}</span>
              <span style="font-weight:bold;font-family:monospace">${v}</span></div>`;
          });
          return res;
        },
      },
      legend: { data: series.map((s) => s.name), textStyle: { color: '#A1A1AA', fontSize: 11 }, top: 0, type: 'scroll' },
      grid: { top: 40, right: 20, bottom: 50, left: 60, containLabel: true },
      xAxis: { type: 'time', axisLine: { lineStyle: { color: '#27272A' } }, axisLabel: { color: '#71717A', fontSize: 11 }, splitLine: { show: false } },
      yAxis: {
        type: isLog ? 'log' : 'value', scale: true,
        name: isRebased ? 'Value (base 100)' : 'Return (%)',
        nameLocation: 'middle', nameGap: 50, nameTextStyle: { color: '#52525B', fontSize: 11 },
        axisLine: { show: false }, axisLabel: { color: '#71717A', fontSize: 11 },
        splitLine: { lineStyle: { color: '#27272A', type: 'dashed' } },
      },
      dataZoom: [{ type: 'inside' }],
      toolbox: { right: 10, top: -5, feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } }, iconStyle: { borderColor: '#52525B' } },
      series,
    };
  }, [results, validComponents, isLog, isRebased]);

  const drawdownOption = useMemo(() => {
    if (!results) return null;
    const series = [{
      name: 'My Portfolio',
      type: 'line', smooth: false, symbol: 'none',
      data: results.drawdownSeries.map((d) => [d.date, +(d.drawdown * 100).toFixed(2)]),
      lineStyle: { color: PORTFOLIO_COLOR, width: 2.5 },
      itemStyle: { color: PORTFOLIO_COLOR },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: PORTFOLIO_COLOR + '30' }, { offset: 1, color: PORTFOLIO_COLOR + '05' }] } },
    }];

    return {
      backgroundColor: 'transparent', graphic: [watermark],
      tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: '#3F3F46' } }, backgroundColor: 'rgba(17,17,19,0.96)', borderColor: '#27272A', textStyle: { color: '#E4E4E7' } },
      grid: { top: 20, right: 20, bottom: 40, left: 60, containLabel: true },
      xAxis: { type: 'time', axisLine: { lineStyle: { color: '#27272A' } }, axisLabel: { color: '#71717A', fontSize: 11 }, splitLine: { show: false } },
      yAxis: { type: 'value', max: 0, axisLabel: { color: '#71717A', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#27272A', type: 'dashed' } } },
      toolbox: { right: 10, top: -5, feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } }, iconStyle: { borderColor: '#52525B' } },
      series,
    };
  }, [results]);

  // Allocation donut
  const allocationOption = useMemo(() => {
    if (!validComponents.length) return null;
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: 'rgba(17,17,19,0.96)', borderColor: '#27272A', textStyle: { color: '#E4E4E7' }, formatter: '{b}: {d}%' },
      series: [{
        type: 'pie', radius: ['45%', '70%'], center: ['50%', '50%'],
        label: { show: true, color: '#A1A1AA', fontSize: 11, formatter: '{b}\n{d}%' },
        data: validComponents.map((c) => {
          const item = registry.find((r) => r.id === c.id);
          return { name: item?.name || c.id, value: parseFloat(c.weight), itemStyle: { color: item?.color || '#71717A' } };
        }),
        itemStyle: { borderColor: '#111113', borderWidth: 2 },
      }],
    };
  }, [validComponents]);

  const m = results?.metrics;
  const metricsRows = [
    ['CAGR', 'cagr', fmtPct], ['Total Return', 'totalReturn', fmtPct], ['Volatility', 'vol', fmtPct],
    ['Sharpe', 'sharpe', fmtNum], ['Sortino', 'sortino', fmtNum], ['Calmar', 'calmar', fmtNum],
    ['Max DD', 'maxDD', fmtPct], ['DD Duration', 'maxDDDuration', fmtDays],
    ['Best Year', 'bestYear', fmtPct], ['Worst Year', 'worstYear', fmtPct],
    ['Pos. Months', 'positiveMonths', (v) => v != null ? `${v.toFixed(1)}%` : '-'],
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6" data-testid="portfolio-builder">
      {/* Left Panel */}
      <div className="lg:w-72 flex-shrink-0 space-y-4">
        {/* Components */}
        <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">Portfolio components</h3>
          <div className="space-y-2.5">
            {components.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={comp.id}
                  onChange={(e) => updateComponent(idx, 'id', e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none min-w-0"
                >
                  <option value="">Select...</option>
                  {registry.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={comp.weight}
                  onChange={(e) => updateComponent(idx, 'weight', e.target.value)}
                  placeholder="%"
                  min="0" max="100"
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white text-center focus:border-cyan-500 focus:outline-none font-mono"
                />
                <button onClick={() => removeComponent(idx)} className="text-zinc-600 hover:text-red-400 transition-colors p-1" disabled={components.length <= 1}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {components.length < MAX_COMPONENTS && (
            <button onClick={addComponent} className="mt-2 text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add component
            </button>
          )}

          {/* Weight status */}
          <div className={`mt-3 text-xs font-mono ${weightStatus === 'ok' ? 'text-emerald-400' : weightStatus === 'over' ? 'text-red-400' : 'text-amber-400'}`}>
            {weightStatus === 'ok' && <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Total: 100%</span>}
            {weightStatus === 'under' && `Total: ${totalWeight.toFixed(1)}% — ${(100 - totalWeight).toFixed(1)}% remaining`}
            {weightStatus === 'over' && `Total: ${totalWeight.toFixed(1)}% — exceeds 100%`}
          </div>

          <button onClick={autoBalance} className="mt-2 text-[10px] text-zinc-500 hover:text-zinc-300 underline">Auto-balance</button>
        </div>

        {/* Rebalancing */}
        <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Rebalancing frequency</h3>
          <select value={rebalanceFreq} onChange={(e) => setRebalanceFreq(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none">
            {REBALANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">Rebalancing periodically resets weights back to your target allocation.</p>
        </div>

        {/* Display options */}
        <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-400">Log Scale</Label>
            <Switch checked={isLog} onCheckedChange={setIsLog} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-400">Rebased to 100</Label>
            <Switch checked={isRebased} onCheckedChange={setIsRebased} />
          </div>
        </div>

        {/* Calculate */}
        <Button onClick={handleCalculate} disabled={!canCalculate} className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 text-white py-5 font-bold disabled:opacity-40 disabled:cursor-not-allowed">
          Calculate Portfolio
        </Button>
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {error}</p>}

        {results && (
          <Button onClick={copyShareLink} variant="ghost" className="w-full text-zinc-500 hover:text-white text-xs gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Copy share link
          </Button>
        )}
      </div>

      {/* Right Panel */}
      <div className="flex-1 min-w-0">
        {!results ? (
          <div className="h-[400px] flex items-center justify-center text-zinc-600 text-sm">
            Configure your portfolio on the left and click Calculate to see results.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'CAGR', value: fmtPct(m?.cagr), color: (m?.cagr ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Sharpe Ratio', value: fmtNum(m?.sharpe), color: 'text-white' },
                { label: 'Max Drawdown', value: fmtPct(m?.maxDD), color: 'text-red-400' },
                { label: 'Volatility', value: fmtPct(m?.vol), color: 'text-white' },
              ].map((metric) => (
                <div key={metric.label} className="bg-[#141416] border border-zinc-800 rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{metric.label}</p>
                  <p className={`text-2xl font-bold font-mono ${metric.color}`}>{metric.value}</p>
                </div>
              ))}
            </div>

            {/* Allocation donut + effective range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allocationOption && (
                <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Allocation</p>
                  <ReactECharts option={allocationOption} style={{ height: '200px' }} notMerge theme="dark" />
                </div>
              )}
              <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 flex flex-col justify-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Backtest range</p>
                <p className="text-sm font-mono text-zinc-300">{results.effectiveRange.start}</p>
                <p className="text-sm font-mono text-zinc-300">{results.effectiveRange.end}</p>
                <p className="text-xs text-zinc-500 mt-1">{results.years} years</p>
                <p className="text-xs text-zinc-600 mt-2">Rebalanced: {rebalanceFreq}</p>
              </div>
            </div>

            {/* Equity Curve */}
            {equityOption && (
              <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Equity Curve</p>
                <ReactECharts option={equityOption} style={{ height: '380px' }} notMerge theme="dark" />
              </div>
            )}

            {/* Drawdown */}
            {drawdownOption && (
              <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Drawdown</p>
                <ReactECharts option={drawdownOption} style={{ height: '250px' }} notMerge theme="dark" />
              </div>
            )}

            {/* Full Metrics Table */}
            <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 overflow-x-auto">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">Full Metrics</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-3 py-2 text-left text-zinc-500 font-medium"></th>
                    <th className="px-3 py-2 text-right font-semibold border-l border-cyan-800/30" style={{ color: PORTFOLIO_COLOR }}>My Portfolio</th>
                    {validComponents.map((c) => {
                      const item = registry.find((r) => r.id === c.id);
                      return <th key={c.id} className="px-3 py-2 text-right text-zinc-400 font-medium">{item?.name}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {metricsRows.map(([label, key, fmt]) => (
                    <tr key={key} className="border-b border-zinc-800/50">
                      <td className="px-3 py-2 text-zinc-500 text-xs">{label}</td>
                      <td className="px-3 py-2 text-right font-mono text-white font-semibold border-l border-cyan-800/30 bg-cyan-950/10">{fmt(m?.[key])}</td>
                      {validComponents.map((c) => {
                        const cm = results.componentMetrics[c.id];
                        return <td key={c.id} className="px-3 py-2 text-right font-mono text-zinc-400">{fmt(cm?.[key])}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioBuilder;
