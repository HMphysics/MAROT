import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const riskColors = {
  'Low': '#10B981',
  'Low-Medium': '#84CC16',
  'Medium': '#EAB308',
  'Medium-High': '#F59E0B',
  'High': '#EF4444',
  'Very High': '#DC2626',
};

const fmtPct = (v) => {
  if (v == null || !isFinite(v)) return '-';
  return `${(v * 100).toFixed(1)}%`;
};

const StrategyCard = ({ item, metrics }) => {
  const riskColor = riskColors[item.riskProfile] || '#71717A';

  return (
    <div className="bg-[#141416] border border-zinc-800 rounded-xl p-6" data-testid={`summary-card-${item.id}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
          <h3 className="text-xl font-bold text-white">{item.name}</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ color: riskColor, borderColor: riskColor + '50', backgroundColor: riskColor + '15' }}>
          {item.riskProfile}
        </span>
      </div>
      <p className="text-xs text-zinc-500 ml-6 mb-4">{item.category}</p>

      {/* Description */}
      <p className="text-sm text-zinc-300 leading-relaxed mb-5">{item.longDescription}</p>

      {/* Key Metrics */}
      {metrics && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 mb-5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">Key Metrics</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div>
              <p className="text-[10px] text-zinc-600 uppercase">CAGR</p>
              <p className="text-sm font-mono font-semibold text-white">{fmtPct(metrics.cagr)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase">Sharpe</p>
              <p className="text-sm font-mono font-semibold text-white">{metrics.sharpe?.toFixed(2) ?? '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase">Max DD</p>
              <p className="text-sm font-mono font-semibold text-red-400">{fmtPct(metrics.maxDD)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase">Volatility</p>
              <p className="text-sm font-mono font-semibold text-white">{fmtPct(metrics.vol)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase">Best Year</p>
              <p className="text-sm font-mono font-semibold text-emerald-400">{fmtPct(metrics.bestYear)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Pros</p>
          <ul className="space-y-1.5">
            {item.pros.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Cons</p>
          <ul className="space-y-1.5">
            {item.cons.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <XCircle className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const BenchmarkCard = ({ item, metrics }) => (
  <div className="bg-[#141416] border border-zinc-800/60 rounded-lg p-5" data-testid={`summary-card-${item.id}`}>
    <div className="flex items-center gap-3 mb-2">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
      <h3 className="text-base font-semibold text-zinc-300">{item.name}</h3>
      <span className="text-[10px] uppercase tracking-wider text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">bench</span>
    </div>
    <p className="text-sm text-zinc-500 mb-3 ml-[22px]">{item.description}</p>
    {metrics && (
      <div className="flex gap-6 ml-[22px]">
        <div>
          <p className="text-[10px] text-zinc-600 uppercase">CAGR</p>
          <p className="text-sm font-mono text-zinc-300">{fmtPct(metrics.cagr)}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-600 uppercase">Sharpe</p>
          <p className="text-sm font-mono text-zinc-300">{metrics.sharpe?.toFixed(2) ?? '-'}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-600 uppercase">Max DD</p>
          <p className="text-sm font-mono text-red-400">{fmtPct(metrics.maxDD)}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-600 uppercase">Vol</p>
          <p className="text-sm font-mono text-zinc-300">{fmtPct(metrics.vol)}</p>
        </div>
      </div>
    )}
  </div>
);

const StrategySummary = ({ selectedItems, registry, metricsMap }) => {
  if (!selectedItems.length) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-zinc-500 gap-3" data-testid="summary-empty">
        <p className="text-sm">Select strategies and benchmarks from the side panel to see their summary here.</p>
      </div>
    );
  }

  const stratItems = selectedItems
    .map((id) => registry.find((r) => r.id === id))
    .filter((item) => item?.type === 'strategy');

  const benchItems = selectedItems
    .map((id) => registry.find((r) => r.id === id))
    .filter((item) => item?.type === 'benchmark');

  return (
    <div className="space-y-5" data-testid="strategy-summary">
      {stratItems.map((item) => (
        <StrategyCard key={item.id} item={item} metrics={metricsMap[item.id]} />
      ))}
      {benchItems.length > 0 && stratItems.length > 0 && (
        <div className="border-t border-zinc-800 pt-5" />
      )}
      {benchItems.map((item) => (
        <BenchmarkCard key={item.id} item={item} metrics={metricsMap[item.id]} />
      ))}
    </div>
  );
};

export default StrategySummary;
