import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BarChart3, LineChart, TrendingDown, ScatterChart as ScatterIcon, BarChart, Calculator, Grid3X3, FileText } from 'lucide-react';
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
import InvestmentCalculator from '@/components/quant/InvestmentCalculator';
import CorrelationHeatmap from '@/components/quant/CorrelationHeatmap';
import StrategySummary from '@/components/quant/StrategySummary';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DATE_PRESETS = [
  { label: 'YTD', getValue: () => `${new Date().getFullYear()}-01-01` },
  { label: '1Y', getValue: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0]; } },
  { label: '3Y', getValue: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 3); return d.toISOString().split('T')[0]; } },
  { label: '5Y', getValue: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d.toISOString().split('T')[0]; } },
  { label: 'MAX', getValue: () => null },
];

const QuantStrategiesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [computing, setComputing] = useState(true);

  // Parse URL state once on mount
  const initRef = useRef({
    selected: searchParams.get('s')?.split(',').filter(Boolean) || ['pulse', 'helix', 'spy'],
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
                    <TooltipProvider delayDuration={300}>
                    {strategies.map((s) => (
                      <Tooltip key={s.id}>
                        <TooltipTrigger asChild>
                          <label className="flex items-center gap-2.5 cursor-pointer group" data-testid={`strategy-checkbox-${s.id}`}>
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
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-zinc-900 border-zinc-700 text-zinc-300 text-xs max-w-[240px]">
                          {s.shortDescription}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    </TooltipProvider>
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
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-zinc-400">Rebased to 100</Label>
                      <Switch checked={isRebased} onCheckedChange={setIsRebased} data-testid="rebase-toggle" />
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1.5 leading-relaxed">
                      {isRebased
                        ? 'All series start at 100 on the common start date, to compare relative growth.'
                        : 'Shows cumulative return (%) from each series\' own start date.'}
                    </p>
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
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {computing ? (
                  <div className="space-y-6">
                    <Skeleton className="h-[450px] bg-zinc-800/30 rounded-lg" />
                    <Skeleton className="h-[350px] bg-zinc-800/30 rounded-lg" />
                  </div>
                ) : (
                  <Tabs defaultValue="summary" className="space-y-6">
                    <TabsList className="bg-[#141416] border border-zinc-800 p-1 h-auto flex flex-wrap gap-1" data-testid="chart-tabs">
                      <TabsTrigger value="summary" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-xs gap-1.5 px-3 py-1.5">
                        <FileText className="w-3.5 h-3.5" /> Summary
                      </TabsTrigger>
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
                      <TabsTrigger value="calculator" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-xs gap-1.5 px-3 py-1.5">
                        <Calculator className="w-3.5 h-3.5" /> Calculator
                      </TabsTrigger>
                      <TabsTrigger value="correlation" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 text-xs gap-1.5 px-3 py-1.5">
                        <Grid3X3 className="w-3.5 h-3.5" /> Correlation
                      </TabsTrigger>
                    </TabsList>

                    <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 md:p-6">
                      <TabsContent value="summary" className="mt-0">
                        <StrategySummary selectedItems={selectedItems} registry={registry} metricsMap={metricsMap} />
                      </TabsContent>
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
                      <TabsContent value="calculator" className="mt-0">
                        <InvestmentCalculator pageSelectedItems={selectedItems} normalizedData={normalizedData} />
                      </TabsContent>
                      <TabsContent value="correlation" className="mt-0">
                        <CorrelationHeatmap selectedItems={selectedItems} registry={registry} normalizedData={normalizedData} dateRange={dateRange} />
                      </TabsContent>
                    </div>
                  </Tabs>
                )}

                {/* Metrics Table — always visible below charts */}
                {!computing && selectedItems.length > 0 && (
                  <div className="mt-8 bg-[#111113] border border-zinc-800 rounded-xl p-4 md:p-6">
                    <MetricsTable selectedItems={selectedItems} registry={registry} metricsMap={metricsMap} />
                  </div>
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
