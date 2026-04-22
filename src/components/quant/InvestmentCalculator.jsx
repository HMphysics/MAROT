import React, { useState, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSearchParams } from 'react-router-dom';
import { Calculator, TrendingUp, TrendingDown, Shuffle, Check, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { registry, getStrategies, getBenchmarks } from '@/data/registry';
import { normalizeSeries } from '@/lib/seriesNormalizer';
import { simulateInvestment } from '@/lib/investmentCalculator';
import { watermark } from '@/lib/chartTheme';

const fmtMoney = (v) => {
  if (v == null || !isFinite(v)) return '-';
  return v.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';
};
const fmtPct = (v) => {
  if (v == null || !isFinite(v)) return '-';
  return (v * 100).toFixed(2) + '%';
};

const defaultStart = (mode) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - (mode === 'accumulation' ? 5 : 20));
  return d.toISOString().split('T')[0];
};
const defaultInitial = (mode) => mode === 'accumulation' ? 10000 : 500000;

const InputField = ({ label, value, onChange, type = 'number', suffix, ...props }) => (
  <div>
    <label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1 block">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
        data-testid={`calc-${label.toLowerCase().replace(/\s+/g, '-')}`}
        {...props}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{suffix}</span>}
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1 block">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// Summary card
const SummaryCard = ({ mode, results, selectedIds }) => {
  if (!results || Object.keys(results).length === 0) return null;
  const entries = selectedIds.map((id) => ({ id, ...results[id] })).filter((r) => r && !r.error);
  if (entries.length === 0) return null;

  const best = [...entries].sort((a, b) => b.finalValue - a.finalValue)[0];
  const bestItem = registry.find((r) => r.id === best.id);
  const benchEntry = entries.find((e) => registry.find((r) => r.id === e.id)?.type === 'benchmark');

  if (mode === 'accumulation') {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 mb-4" data-testid="calc-summary">
        <p className="text-sm text-zinc-400">
          Invertiste <span className="text-white font-semibold">{fmtMoney(best.totalInvested)}</span> entre {best.history?.[0]?.date} y {best.history?.[best.history.length - 1]?.date}
        </p>
        <p className="text-sm mt-1">
          <span className="text-cyan-400 font-semibold">{bestItem?.name}</span> lo habría convertido en{' '}
          <span className="text-white font-semibold">{fmtMoney(best.finalValue)}</span>{' '}
          <span className="text-emerald-400">(+{fmtPct(best.totalReturnPct)})</span>
        </p>
        {benchEntry && benchEntry.id !== best.id && (
          <p className="text-sm text-zinc-500 mt-1">
            vs {fmtMoney(benchEntry.finalValue)} del {registry.find((r) => r.id === benchEntry.id)?.name}
          </p>
        )}
      </div>
    );
  }

  if (mode === 'withdrawal') {
    const allDepleted = entries.every((e) => !e.survived);
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 mb-4" data-testid="calc-summary">
        <p className="text-sm text-zinc-400">
          Empezaste con <span className="text-white font-semibold">{fmtMoney(best.totalInvested)}</span>, retirando periodicamente durante {best.durationYears} años
        </p>
        {allDepleted ? (
          <p className="text-sm text-red-400 mt-1">Ninguna estrategia habría sobrevivido este escenario</p>
        ) : (
          <p className="text-sm mt-1">
            <span className="text-cyan-400 font-semibold">{bestItem?.name}</span>: te quedan{' '}
            <span className="text-white font-semibold">{fmtMoney(best.finalValue)}</span> al final
          </p>
        )}
      </div>
    );
  }

  // mixed
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 mb-4" data-testid="calc-summary">
      <p className="text-sm text-zinc-400">
        Aportaste <span className="text-white font-semibold">{fmtMoney(best.totalInvested)}</span>,
        retiraste <span className="text-white font-semibold">{fmtMoney(best.totalWithdrawn)}</span>
      </p>
      <p className="text-sm mt-1">
        Mejor resultado final: <span className="text-cyan-400 font-semibold">{bestItem?.name}</span> con{' '}
        <span className="text-white font-semibold">{fmtMoney(best.finalValue)}</span>
      </p>
    </div>
  );
};

const InvestmentCalculator = ({ pageSelectedItems, normalizedData }) => {
  const [searchParams] = useSearchParams();

  // Parse initial state from URL or defaults
  const [mode, setMode] = useState(searchParams.get('calc_mode') || 'accumulation');
  const [initialAmount, setInitialAmount] = useState(searchParams.get('calc_initial') || String(defaultInitial('accumulation')));
  const [startDate, setStartDate] = useState(searchParams.get('calc_start') || defaultStart('accumulation'));
  const [endDate, setEndDate] = useState(searchParams.get('calc_end') || new Date().toISOString().split('T')[0]);

  // Contributions
  const [contribAmount, setContribAmount] = useState(searchParams.get('calc_contrib') || '0');
  const [contribFreq, setContribFreq] = useState(searchParams.get('calc_contrib_freq') || 'monthly');
  const [contribDay, setContribDay] = useState('1');
  const [contribInflation, setContribInflation] = useState(searchParams.get('calc_inflation') === '1');

  // Mixed mode
  const [contribEndDate, setContribEndDate] = useState('');

  // Withdrawals
  const [withdrawType, setWithdrawType] = useState(searchParams.get('calc_withdraw_type') || 'fixed');
  const [withdrawAmount, setWithdrawAmount] = useState(searchParams.get('calc_withdraw') || '2000');
  const [withdrawFreq, setWithdrawFreq] = useState(searchParams.get('calc_withdraw_freq') || 'monthly');
  const [withdrawDay, setWithdrawDay] = useState('1');
  const [withdrawInflation, setWithdrawInflation] = useState(false);

  // Series selection
  const [selectedIds, setSelectedIds] = useState(
    searchParams.get('calc_series')?.split(',').filter(Boolean) || [...pageSelectedItems]
  );

  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Mode change handler
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setInitialAmount(String(defaultInitial(newMode)));
    setStartDate(defaultStart(newMode));
    setResults(null);
  }, []);

  const toggleSeries = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // Validate & calculate
  const handleCalculate = useCallback(() => {
    setError('');
    const initial = parseFloat(initialAmount);
    const contrib = parseFloat(contribAmount) || 0;
    const withdraw = parseFloat(withdrawAmount) || 0;

    if (isNaN(initial) || initial < 0) { setError('Inversión inicial no válida'); return; }
    if (mode === 'accumulation' && initial === 0 && contrib === 0) { setError('Inversión inicial o aportación debe ser > 0'); return; }
    if ((mode === 'withdrawal' || mode === 'mixed') && initial === 0) { setError('Capital inicial debe ser > 0 en modo retirada'); return; }
    if (startDate >= endDate) { setError('Fecha inicio debe ser anterior a fecha fin'); return; }
    if (mode === 'mixed' && contribEndDate && (contribEndDate <= startDate || contribEndDate >= endDate)) {
      setError('Fecha fin de aportaciones debe estar entre inicio y fin'); return;
    }
    if (selectedIds.length === 0) { setError('Selecciona al menos una serie'); return; }

    const newResults = {};
    for (const id of selectedIds) {
      const data = normalizedData[id];
      if (!data || data.length === 0) { newResults[id] = { error: 'No data' }; continue; }

      newResults[id] = simulateInvestment({
        series: data,
        mode,
        initialAmount: initial,
        startDate,
        endDate,
        contributions: {
          amount: contrib,
          frequency: (mode === 'accumulation' || mode === 'mixed') ? contribFreq : 'none',
          dayOfMonth: parseInt(contribDay),
          adjustInflation: contribInflation,
        },
        withdrawals: {
          type: withdrawType,
          amount: withdraw,
          frequency: (mode === 'withdrawal' || mode === 'mixed') ? withdrawFreq : 'none',
          dayOfMonth: parseInt(withdrawDay),
          adjustInflation: withdrawInflation,
        },
        contributionEndDate: mode === 'mixed' ? contribEndDate : undefined,
      });
    }

    setResults(newResults);

    // Persist to URL
    const params = new URLSearchParams(window.location.search);
    params.set('calc_mode', mode);
    params.set('calc_initial', initialAmount);
    params.set('calc_start', startDate);
    params.set('calc_end', endDate);
    if (contrib > 0) { params.set('calc_contrib', contribAmount); params.set('calc_contrib_freq', contribFreq); }
    if (withdraw > 0) { params.set('calc_withdraw', withdrawAmount); params.set('calc_withdraw_type', withdrawType); params.set('calc_withdraw_freq', withdrawFreq); }
    if (contribInflation) params.set('calc_inflation', '1');
    params.set('calc_series', selectedIds.join(','));
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [mode, initialAmount, startDate, endDate, contribAmount, contribFreq, contribDay, contribInflation, contribEndDate, withdrawType, withdrawAmount, withdrawFreq, withdrawDay, withdrawInflation, selectedIds, normalizedData]);

  // Chart option
  const chartOption = useMemo(() => {
    if (!results) return null;
    const series = [];
    let hasNetInvested = false;

    selectedIds.forEach((id) => {
      const r = results[id];
      const item = registry.find((reg) => reg.id === id);
      if (!r || r.error || !r.history || !item) return;

      series.push({
        name: item.name,
        type: 'line', smooth: false, symbol: 'none',
        data: r.history.map((h) => [h.date, h.portfolioValue]),
        lineStyle: { color: item.color, width: item.type === 'strategy' ? 2.5 : 1.8 },
        itemStyle: { color: item.color },
        z: item.type === 'strategy' ? 10 : 1,
      });

      // Mark depletion
      if (r.depletedDate) {
        series.push({
          name: `${item.name} (agotado)`,
          type: 'scatter', symbol: 'circle', symbolSize: 12,
          data: [[r.depletedDate, 0]],
          itemStyle: { color: '#EF4444', borderColor: '#fff', borderWidth: 2 },
          z: 20,
        });
      }

      if (!hasNetInvested && r.history.length > 0) {
        hasNetInvested = true;
        series.push({
          name: 'Capital neto invertido',
          type: 'line', smooth: false, symbol: 'none',
          data: r.history.map((h) => [h.date, h.netInvested]),
          lineStyle: { color: '#52525B', width: 1.5, type: 'dashed' },
          itemStyle: { color: '#52525B' },
          z: 0,
        });
      }
    });

    if (series.length === 0) return null;

    return {
      backgroundColor: 'transparent',
      graphic: [watermark],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', snap: true, lineStyle: { color: '#3F3F46' } },
        backgroundColor: 'rgba(17, 17, 19, 0.96)',
        borderColor: '#27272A',
        textStyle: { color: '#E4E4E7', fontSize: 13 },
        formatter: (params) => {
          if (!params.length) return '';
          const valid = params.filter((p) => p.value && p.value[1] != null);
          if (valid.length === 0) return '';
          const sorted = [...valid].sort((a, b) => (b.value[1] ?? 0) - (a.value[1] ?? 0));
          let res = `<div style="font-weight:600;color:#A1A1AA;margin-bottom:8px">${sorted[0].value[0]}</div>`;
          sorted.forEach((p) => {
            const v = p.value[1];
            res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px">
              <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block"></span>${p.seriesName}</span>
              <span style="font-weight:bold;font-family:monospace">${v.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</span>
            </div>`;
          });
          return res;
        },
      },
      legend: { data: series.map((s) => s.name), textStyle: { color: '#A1A1AA', fontSize: 11 }, top: 0, type: 'scroll' },
      grid: { top: 40, right: 20, bottom: 50, left: 60, containLabel: true },
      xAxis: { type: 'time', axisLine: { lineStyle: { color: '#27272A' } }, axisLabel: { color: '#71717A', fontSize: 11 }, splitLine: { show: false } },
      yAxis: {
        type: 'value', name: 'Valor (€)', nameLocation: 'middle', nameGap: 55,
        nameTextStyle: { color: '#52525B', fontSize: 11 },
        axisLabel: { color: '#71717A', fontSize: 11, formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v },
        splitLine: { lineStyle: { color: '#27272A', type: 'dashed' } },
      },
      dataZoom: [{ type: 'inside' }],
      toolbox: { right: 10, top: -5, feature: { saveAsImage: { title: 'Export PNG', pixelRatio: 2, backgroundColor: '#111113' } }, iconStyle: { borderColor: '#52525B' } },
      series,
    };
  }, [results, selectedIds]);

  const strategies = getStrategies();
  const benchmarksList = getBenchmarks();
  const showContrib = mode === 'accumulation' || mode === 'mixed';
  const showWithdraw = mode === 'withdrawal' || mode === 'mixed';

  const resultEntries = results
    ? selectedIds.map((id) => ({ id, item: registry.find((r) => r.id === id), ...(results[id] || {}) })).filter((e) => e.item && !e.error)
    : [];
  const sortedEntries = mode === 'withdrawal'
    ? [...resultEntries].sort((a, b) => (b.yearsLasted ?? 0) - (a.yearsLasted ?? 0))
    : [...resultEntries].sort((a, b) => (b.finalValue ?? 0) - (a.finalValue ?? 0));
  const bestId = sortedEntries[0]?.id;

  return (
    <div className="flex flex-col lg:flex-row gap-6" data-testid="investment-calculator">
      {/* Inputs Panel */}
      <div className="lg:w-72 flex-shrink-0 space-y-4">
        {/* Mode */}
        <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">Modo</h3>
          <RadioGroup value={mode} onValueChange={handleModeChange} className="space-y-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="accumulation" id="mode-acc" className="border-zinc-600" />
              <Label htmlFor="mode-acc" className="text-sm text-zinc-300 cursor-pointer flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" />Acumulación</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="withdrawal" id="mode-wd" className="border-zinc-600" />
              <Label htmlFor="mode-wd" className="text-sm text-zinc-300 cursor-pointer flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-red-400" />Retirada</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="mixed" id="mode-mix" className="border-zinc-600" />
              <Label htmlFor="mode-mix" className="text-sm text-zinc-300 cursor-pointer flex items-center gap-1.5"><Shuffle className="w-3.5 h-3.5 text-amber-400" />Mixto</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Basic params */}
        <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4 space-y-3">
          <InputField label="Inversión inicial" value={initialAmount} onChange={setInitialAmount} suffix="€" min="0" />
          <InputField label="Fecha inicio" value={startDate} onChange={setStartDate} type="date" />
          <InputField label="Fecha fin" value={endDate} onChange={setEndDate} type="date" />
        </div>

        {/* Contributions */}
        {showContrib && (
          <div className="bg-[#141416] border border-cyan-900/30 rounded-lg p-4 space-y-3">
            <h3 className="text-[10px] uppercase tracking-wider text-cyan-600 font-semibold">Aportaciones</h3>
            <InputField label="Importe" value={contribAmount} onChange={setContribAmount} suffix="€" min="0" />
            <SelectField label="Frecuencia" value={contribFreq} onChange={setContribFreq} options={[
              { value: 'none', label: 'Ninguna' }, { value: 'monthly', label: 'Mensual' },
              { value: 'quarterly', label: 'Trimestral' }, { value: 'annual', label: 'Anual' },
            ]} />
            <InputField label="Día del mes" value={contribDay} onChange={setContribDay} min="1" max="28" />
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={contribInflation} onCheckedChange={setContribInflation} className="border-zinc-600" />
              <span className="text-xs text-zinc-400">Ajustar inflación 2%/año</span>
            </label>
            {mode === 'mixed' && (
              <InputField label="Fin de aportaciones" value={contribEndDate} onChange={setContribEndDate} type="date" />
            )}
          </div>
        )}

        {/* Withdrawals */}
        {showWithdraw && (
          <div className="bg-[#141416] border border-red-900/30 rounded-lg p-4 space-y-3">
            <h3 className="text-[10px] uppercase tracking-wider text-red-500 font-semibold">Retiradas</h3>
            <RadioGroup value={withdrawType} onValueChange={setWithdrawType} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fixed" id="wd-fixed" className="border-zinc-600" />
                <Label htmlFor="wd-fixed" className="text-xs text-zinc-400 cursor-pointer">Importe fijo</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pct_initial" id="wd-pct-init" className="border-zinc-600" />
                <Label htmlFor="wd-pct-init" className="text-xs text-zinc-400 cursor-pointer">% del capital inicial</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pct_current" id="wd-pct-cur" className="border-zinc-600" />
                <Label htmlFor="wd-pct-cur" className="text-xs text-zinc-400 cursor-pointer">% del capital actual</Label>
              </div>
            </RadioGroup>
            <InputField
              label={withdrawType === 'fixed' ? '€ por retirada' : withdrawType === 'pct_initial' ? '% anual sobre capital inicial' : '% anual sobre capital actual'}
              value={withdrawAmount}
              onChange={setWithdrawAmount}
              suffix={withdrawType === 'fixed' ? '€' : '%'}
              min="0"
            />
            <SelectField label="Frecuencia" value={withdrawFreq} onChange={setWithdrawFreq} options={[
              { value: 'monthly', label: 'Mensual' }, { value: 'quarterly', label: 'Trimestral' }, { value: 'annual', label: 'Anual' },
            ]} />
            <InputField label="Día del mes" value={withdrawDay} onChange={setWithdrawDay} min="1" max="28" />
            {(withdrawType === 'fixed' || withdrawType === 'pct_initial') && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={withdrawInflation} onCheckedChange={setWithdrawInflation} className="border-zinc-600" />
                <span className="text-xs text-zinc-400">Ajustar inflación 2%/año</span>
              </label>
            )}
          </div>
        )}

        {/* Series selector */}
        <div className="bg-[#141416] border border-zinc-800 rounded-lg p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Comparar</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {[...strategies, ...benchmarksList].map((s) => (
              <label key={s.id} className="flex items-center gap-2 cursor-pointer text-xs">
                <Checkbox
                  checked={selectedIds.includes(s.id)}
                  onCheckedChange={() => toggleSeries(s.id)}
                  className="border-zinc-600 data-[state=checked]:border-transparent"
                  style={{ backgroundColor: selectedIds.includes(s.id) ? s.color : undefined }}
                />
                <span className="text-zinc-400">{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Calculate button */}
        <button
          onClick={handleCalculate}
          className="w-full py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-500 hover:to-cyan-400 transition-all"
          data-testid="calc-calculate-btn"
        >
          <Calculator className="w-4 h-4 inline mr-2" />
          Calcular
        </button>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      {/* Results Panel */}
      <div className="flex-1 min-w-0">
        {!results ? (
          <div className="h-[400px] flex items-center justify-center text-zinc-600 text-sm">
            Configura los parámetros y pulsa "Calcular"
          </div>
        ) : (
          <div className="space-y-5">
            <SummaryCard mode={mode} results={results} selectedIds={selectedIds} />

            {/* Chart */}
            {chartOption && (
              <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4" data-testid="calc-chart">
                <ReactECharts option={chartOption} style={{ height: '380px', width: '100%' }} notMerge theme="dark" />
              </div>
            )}

            {/* Results table */}
            {sortedEntries.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-zinc-800" data-testid="calc-results-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="px-3 py-2.5 text-left font-medium text-zinc-400">Nombre</th>
                      <th className="px-3 py-2.5 text-right font-medium text-zinc-400">Invertido</th>
                      {showWithdraw && <th className="px-3 py-2.5 text-right font-medium text-zinc-400">Retirado</th>}
                      <th className="px-3 py-2.5 text-right font-medium text-zinc-400">Valor final</th>
                      <th className="px-3 py-2.5 text-right font-medium text-zinc-400">Rentabilidad</th>
                      <th className="px-3 py-2.5 text-right font-medium text-zinc-400">IRR</th>
                      <th className="px-3 py-2.5 text-right font-medium text-zinc-400">Max DD</th>
                      {showWithdraw && <th className="px-3 py-2.5 text-center font-medium text-zinc-400">Duró</th>}
                      {showWithdraw && <th className="px-3 py-2.5 text-right font-medium text-zinc-400">Años</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((r) => (
                      <tr
                        key={r.id}
                        className={`border-b border-zinc-800/50 transition-colors ${r.id === bestId ? 'bg-cyan-950/20 border-l-2 border-l-cyan-500' : 'hover:bg-zinc-900/30'}`}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap font-medium">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.item?.color }} />
                            <span className="text-white">{r.item?.name}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-zinc-300">{fmtMoney(r.totalInvested)}</td>
                        {showWithdraw && <td className="px-3 py-2.5 text-right font-mono text-zinc-300">{fmtMoney(r.totalWithdrawn)}</td>}
                        <td className="px-3 py-2.5 text-right font-mono text-white font-semibold">{fmtMoney(r.finalValue)}</td>
                        <td className={`px-3 py-2.5 text-right font-mono ${(r.totalReturnPct ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtPct(r.totalReturnPct)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-zinc-300">
                          {r.irr != null ? fmtPct(r.irr) : '-'}
                          {r.durationYears < 1 ? '*' : ''}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-red-400">{fmtPct(r.maxDD)}</td>
                        {showWithdraw && (
                          <td className="px-3 py-2.5 text-center">
                            {r.survived
                              ? <Check className="w-4 h-4 text-emerald-400 inline" />
                              : <X className="w-4 h-4 text-red-400 inline" />
                            }
                          </td>
                        )}
                        {showWithdraw && (
                          <td className="px-3 py-2.5 text-right font-mono text-zinc-300">
                            {r.yearsLasted?.toFixed(1)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentCalculator;
