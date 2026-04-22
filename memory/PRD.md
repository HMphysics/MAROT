# Marot Strategies — PRD

## Problem Statement
Quant Strategies comparison page + Investment Calculator for Marot Strategies. All static JSON, no backend.

## Architecture
- **Stack**: Vite + React 18 + Tailwind + shadcn/ui + ECharts + framer-motion
- **Data**: Static JSON in `src/data/strategies/` and `src/data/benchmarks/`
- **Registry**: `src/data/registry.js` — central registry with metadata
- **Normalizer**: `src/lib/seriesNormalizer.js` — tolerant parser
- **Metrics**: Extended `src/lib/metricsCalculator.js`
- **Charts**: All use `xAxis: 'time'` with unified axis + forward-fill via `src/lib/chartUtils.js`
- **Calculator**: `src/lib/investmentCalculator.js` with XIRR (Newton-Raphson)

## What's Been Implemented (2026-04-22)
- [x] Data structure: strategies + benchmarks + registry (12 series total)
- [x] 7 strategies: Ares QQQ, Combinada, BES, Deimos, Fobos, Janus, Tyr
- [x] 5 benchmarks: SPY, QQQ, GLD, 50/50, 60/40
- [x] Extended metrics: Sortino, Calmar, IR, Beta, Alpha, TE, etc.
- [x] 5 chart components + Metrics Table (always visible below)
- [x] All charts: neutral dark backgrounds, watermark "MAROT STRATEGIES"
- [x] Unified axis + forward-fill for mixed-frequency data
- [x] Time axis for proper tooltip with all series
- [x] Lines end at last data point (no false flat extension)
- [x] Rebased to 100 mode with clear UX (base date, axis labels)
- [x] URL state persistence, Export CSV/PNG
- [x] **Investment Calculator** (new): 3 modes (Accumulation, Withdrawal, Mixed)
  - XIRR calculation, contributions/withdrawals with inflation
  - % initial, % current, fixed amount withdrawal types
  - Summary card, chart with net invested line, results table
  - Depletion detection, survival tracking
- [x] Switch toggles visible (cyan ON, gray OFF)
- [x] Benchmark colors distinguishable

## Files Created/Modified
### New files
- `src/data/` — all strategy/benchmark JSONs + registry + README
- `src/lib/seriesNormalizer.js`, `chartUtils.js`, `chartTheme.js`, `investmentCalculator.js`
- `src/components/quant/` — 7 components (EquityCurve, Drawdown, RollingSharpe, RiskReturnScatter, MonthlyHistogram, MetricsTable, InvestmentCalculator)
- `src/pages/QuantStrategiesPage.jsx`

### Modified
- `src/App.jsx` — route
- `src/components/Header.jsx`, `MobileMenu.jsx` — nav link
- `src/lib/metricsCalculator.js` — extended metrics
- `src/components/ui/switch.jsx` — visibility fix

## Backlog
- P1: Custom date range calendar picker
- P1: Correlation matrix heatmap
- P2: Year-over-year returns heatmap
- P2: Monte Carlo simulation for withdrawal scenarios
- P2: PDF report generation
- P3: Multi-currency support
