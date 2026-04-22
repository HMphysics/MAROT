import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BarChart3, LineChart, TrendingDown, ScatterChart as ScatterIcon, BarChart, Table2, TrendingUp, Calendar, Trophy, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import Header from '@/components/Header';
import { registry, getStrategies, getBenchmarks } from '@/data/registry';
import { normalizeSeries } from '@/lib/seriesNormalizer';
import { computeFullMetrics } from '@/lib/metricsCalculator';
import EquityCurveChart from '@/components/quant/EquityCurveChart';
import DrawdownChart from '@/components/quant/DrawdownChart';
import RollingSharpeChart from '@/components/quant/RollingSharpeChart';
import RiskReturnScatter from '@/components/quant/RiskReturnScatter';
import MonthlyHistogram from '@/components/quant/MonthlyHistogram';
import MetricsTable from '@/components/quant/MetricsTable';

const DATE_PRESETS = [
  { label: 'YTD', getValue: () => `${new Date().getFullYear()}-01-01` },
  { label: '1Y', getValue: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0]; } },
  { label: '3Y', getValue: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 3); return d.toISOString().split('T')[0]; } },
  { label: '5Y', getValue: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d.toISOString().split('T')[0]; } },
  { label: 'MAX', getValue: () => null },
];

// Quick Stats component
const QuickStats = ({ selectedItems, registry, normalizedData, metricsMap, dateRange }) => {
  const stats = useMemo(() => {
    if (!selectedItems.length) return null;

    const stratCount = selectedItems.filter((id) => registry.find((r) => r.id === id)?.type === 'strategy').length;
    const benchCount = selectedItems.length - stratCount;

    // Effective date range: latest start → earliest end across selected
    let latestStart = null;
    let earliestEnd = null;
    selectedItems.forEach((id) => {
      const data = normalizedData[id];
      if (!data || data.length === 0) return;
      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (filtered.length === 0) return;
      const first = filtered[0].date;
      const last = filtered[filtered.length - 1].date;
      if (!latestStart || first > latestStart) latestStart = first;
      if (!earliestEnd || last < earliestEnd) earliestEnd = last;
    });

    const years = latestStart && earliestEnd
      ? ((new Date(earliestEnd) - new Date(latestStart)) / (365.25 * 86400000)).toFixed(1)
      : '0';

    // Best / worst / max DD from metrics
    let bestName = '-', bestReturn = -Infinity;
    let worstName = '-', worstReturn = Infinity;
    let maxDDName = '-', maxDD = 0;

    selectedItems.forEach((id) => {
      const m = metricsMap[id];
      const item = registry.find((r) => r.id === id);
      if (!m || !item) return;
      if (m.totalReturn > bestReturn) { bestReturn = m.totalReturn; bestName = item.name; }
      if (m.totalReturn < worstReturn) { worstReturn = m.totalReturn; worstName = item.name; }
      if (Math.abs(m.maxDD) > Math.abs(maxDD)) { maxDD = m.maxDD; maxDDName = item.name; }
    });

    const fmtPct = (v) => (v !== Infinity && v !== -Infinity && isFinite(v)) ? `${(v * 100).toFixed(1)}%` : '-';

    return { stratCount, benchCount, latestStart, earliestEnd, years, bestName, bestReturn: fmtPct(bestReturn), worstName, worstReturn: fmtPct(worstReturn), maxDDName, maxDD: fmtPct(maxDD) };
  }, [selectedItems, registry, normalizedData, metricsMap, dateRange]);

  if (!stats) return null;

  return (
    <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4 space-y-3" data-testid="quick-stats">
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Quick Stats</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Strategies</p>
          <p className="text-lg font-bold text-white">{stats.stratCount}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Benchmarks</p>
          <p className="text-lg font-bold text-white">{stats.benchCount}</p>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-1"><Calendar className="w-3 h-3" /> Effective Range</p>
        <p className="text-sm font-mono text-zinc-300 mt-0.5">{stats.latestStart || '-'}</p>
        <p className="text-sm font-mono text-zinc-300">{stats.earliestEnd || '-'}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{stats.years} years</p>
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-1"><Trophy className="w-3 h-3" /> Best Performer</p>
        <p className="text-sm font-medium text-emerald-400">{stats.bestName}</p>
        <p className="text-xs text-zinc-400">{stats.bestReturn}</p>
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Worst Performer</p>
        <p className="text-sm font-medium text-red-400">{stats.worstName}</p>
        <p className="text-xs text-zinc-400">{stats.worstReturn}</p>
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Deepest Drawdown</p>
        <p className="text-sm font-medium text-orange-400">{stats.maxDDName}</p>
        <p className="text-xs text-zinc-400">{stats.maxDD}</p>
      </div>
    </div>
  );
};

const QuantStrategiesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [computing, setComputing] = useState(true);

  // Parse URL state once on mount
  const initRef = useRef({
    selected: searchParams.get('s')?.split(',').filter(Boolean) || ['ares-qqq', 'combinada', 'spy'],
    benchmark: searchParams.get('b') || 'spy',
    log: searchParams.get('log') === '1',
    rebased: searchParams.get('r') !== '0',
    preset: searchParams.get('p') || 'MAX',
  });

  const [selectedItems, setSelectedItems] = useState(initRef.current.selected);
  const [primaryBenchmark, setPrimaryBenchmark] = useState(initRef.current.benchmark);
  const [isLog, setIsLog] = useState(initRef.current.log);
  const [isRebased, setIsRebased] = useState(initRef.current.rebased);
  const [activePreset, setActivePreset] = useState(initRef.current.preset);

  const dateRange = useMemo(() => {
    const preset = DATE_PRESETS.find((p) => p.label === activePreset);
    const start = preset ? preset.getValue() : null;
    return { start, end: null };
  }, [activePreset]);

  // Sync state to URL without causing re-renders (use window.history directly)
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedItems.length) params.set('s', selectedItems.join(','));
    if (primaryBenchmark) params.set('b', primaryBenchmark);
    if (isLog) params.set('log', '1');
    if (!isRebased) params.set('r', '0');
    if (activePreset !== 'MAX') params.set('p', activePreset);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedItems, primaryBenchmark, isLog, isRebased, activePreset]);

  // Normalize all data once
  const normalizedData = useMemo(() => {
    const result = {};
    registry.forEach((item) => {
      try {
        result[item.id] = normalizeSeries(item.data);
      } catch {
        result[item.id] = [];
      }
    });
    return result;
  }, []);

  // Compute metrics
  const metricsMap = useMemo(() => {
    setComputing(true);
    const benchData = normalizedData[primaryBenchmark] || null;
    const result = {};
    selectedItems.forEach((id) => {
      const data = normalizedData[id];
      if (!data || data.length < 2) return;

      let filtered = data;
      if (dateRange.start) filtered = filtered.filter((d) => d.date >= dateRange.start);
      if (dateRange.end) filtered = filtered.filter((d) => d.date <= dateRange.end);

      let benchFiltered = benchData;
      if (benchData && dateRange.start) {
        benchFiltered = benchData.filter((d) => d.date >= dateRange.start);
      }

      result[id] = computeFullMetrics(filtered, id === primaryBenchmark ? null : benchFiltered);
    });
    setComputing(false);
    return result;
  }, [selectedItems, normalizedData, primaryBenchmark, dateRange]);

  const toggleItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const strategies = getStrategies();
  const benchmarksList = getBenchmarks();

  return (
    <>
      <Helmet>
        <title>Quant Strategies - MAROT STRATEGIES</title>
        <meta name="description" content="Compare quantitative strategies against benchmarks with advanced metrics and visualizations." />
      </Helmet>

      <div className="bg-[#0b0c10] min-h-screen text-white font-sans" data-testid="quant-strategies-page">
        <Header />

        <main className="pt-28 pb-20 px-4 md:px-8">
          <div className="max-w-[1440px] mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight" data-testid="page-title">
              Quant Strategies
            </h1>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Panel */}
              <aside className="lg:w-72 flex-shrink-0 space-y-5" data-testid="controls-panel">
                <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3">Strategies</h3>
                  <div className="space-y-2.5">
                    {strategies.map((s) => (
                      <label key={s.id} className="flex items-center gap-2.5 cursor-pointer group" data-testid={`strategy-checkbox-${s.id}`}>
                        <Checkbox
                          checked={selectedItems.includes(s.id)}
                          onCheckedChange={() => toggleItem(s.id)}
                          className="border-zinc-600 data-[state=checked]:border-transparent"
                          style={{ backgroundColor: selectedItems.includes(s.id) ? s.color : undefined }}
                        />
                        <span className="flex items-center gap-2 text-sm text-zinc-300 group-hover:text-white transition-colors">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3">Benchmarks</h3>
                  <div className="space-y-2.5">
                    {benchmarksList.map((b) => (
                      <label key={b.id} className="flex items-center gap-2.5 cursor-pointer group" data-testid={`benchmark-checkbox-${b.id}`}>
                        <Checkbox
                          checked={selectedItems.includes(b.id)}
                          onCheckedChange={() => toggleItem(b.id)}
                          className="border-zinc-600 data-[state=checked]:border-transparent"
                          style={{ backgroundColor: selectedItems.includes(b.id) ? b.color : undefined }}
                        />
                        <span className="flex items-center gap-2 text-sm text-zinc-300 group-hover:text-white transition-colors">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                          {b.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3">Date Range</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {DATE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setActivePreset(preset.label)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          activePreset === preset.label
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                            : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-600'
                        }`}
                        data-testid={`preset-${preset.label}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-zinc-400">Log Scale</Label>
                    <Switch checked={isLog} onCheckedChange={setIsLog} data-testid="log-toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-zinc-400">Rebased to 100</Label>
                    <Switch checked={isRebased} onCheckedChange={setIsRebased} data-testid="rebase-toggle" />
                  </div>
                </div>

                <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3">
                    Primary Benchmark
                  </h3>
                  <p className="text-[10px] text-zinc-600 mb-2">For Beta, Alpha, IR calculations</p>
                  <RadioGroup value={primaryBenchmark} onValueChange={setPrimaryBenchmark}>
                    {benchmarksList.map((b) => (
                      <div key={b.id} className="flex items-center gap-2" data-testid={`primary-benchmark-${b.id}`}>
                        <RadioGroupItem value={b.id} id={`pb-${b.id}`} className="border-zinc-600" />
                        <Label htmlFor={`pb-${b.id}`} className="text-sm text-zinc-300 cursor-pointer">{b.name}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Quick Stats */}
                <QuickStats
                  selectedItems={selectedItems}
                  registry={registry}
                  normalizedData={normalizedData}
                  metricsMap={metricsMap}
                  dateRange={dateRange}
                />
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {computing ? (
                  <div className="space-y-6">
                    <Skeleton className="h-[450px] bg-zinc-800/30 rounded-lg" />
                    <Skeleton className="h-[350px] bg-zinc-800/30 rounded-lg" />
                  </div>
                ) : (
                  <Tabs defaultValue="equity" className="space-y-6">
                    <TabsList className="bg-[#141416] border border-zinc-800 p-1 h-auto flex flex-wrap gap-1" data-testid="chart-tabs">
                      <TabsTrigger value="equity" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-xs gap-1.5 px-3 py-1.5">
                        <LineChart className="w-3.5 h-3.5" /> Equity Curve
                      </TabsTrigger>
                      <TabsTrigger value="drawdown" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-xs gap-1.5 px-3 py-1.5">
                        <TrendingDown className="w-3.5 h-3.5" /> Drawdown
                      </TabsTrigger>
                      <TabsTrigger value="sharpe" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-xs gap-1.5 px-3 py-1.5">
                        <BarChart3 className="w-3.5 h-3.5" /> Rolling Sharpe
                      </TabsTrigger>
                      <TabsTrigger value="scatter" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-xs gap-1.5 px-3 py-1.5">
                        <ScatterIcon className="w-3.5 h-3.5" /> Risk/Return
                      </TabsTrigger>
                      <TabsTrigger value="histogram" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-xs gap-1.5 px-3 py-1.5">
                        <BarChart className="w-3.5 h-3.5" /> Histogram
                      </TabsTrigger>
                      <TabsTrigger value="table" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-xs gap-1.5 px-3 py-1.5">
                        <Table2 className="w-3.5 h-3.5" /> Metrics Table
                      </TabsTrigger>
                    </TabsList>

                    <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 md:p-6">
                      <TabsContent value="equity" className="mt-0">
                        <EquityCurveChart selectedItems={selectedItems} registry={registry} normalizedData={normalizedData} isLog={isLog} isRebased={isRebased} dateRange={dateRange} />
                      </TabsContent>
                      <TabsContent value="drawdown" className="mt-0">
                        <DrawdownChart selectedItems={selectedItems} registry={registry} normalizedData={normalizedData} dateRange={dateRange} />
                      </TabsContent>
                      <TabsContent value="sharpe" className="mt-0">
                        <RollingSharpeChart selectedItems={selectedItems} registry={registry} normalizedData={normalizedData} dateRange={dateRange} />
                      </TabsContent>
                      <TabsContent value="scatter" className="mt-0">
                        <RiskReturnScatter selectedItems={selectedItems} registry={registry} metricsMap={metricsMap} />
                      </TabsContent>
                      <TabsContent value="histogram" className="mt-0">
                        <MonthlyHistogram selectedItems={selectedItems} registry={registry} normalizedData={normalizedData} dateRange={dateRange} />
                      </TabsContent>
                      <TabsContent value="table" className="mt-0">
                        <MetricsTable selectedItems={selectedItems} registry={registry} metricsMap={metricsMap} />
                      </TabsContent>
                    </div>
                  </Tabs>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default QuantStrategiesPage;
