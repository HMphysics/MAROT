# Marot Strategies - Quant Strategies Feature PRD

## Problem Statement
Add a "Quant Strategies" section to Marot Strategies to compare quantitative strategies against benchmarks (S&P 500, Nasdaq, etc.) with charts and metrics. Everything static — JSONs versioned in repo, no Supabase.

## Architecture
- **Stack**: Vite + React 18 + Tailwind + shadcn/ui + ECharts + framer-motion
- **Data**: Static JSON files in `src/data/strategies/` and `src/data/benchmarks/`
- **Registry**: `src/data/registry.js` — central registry importing all JSONs with metadata
- **Metrics**: Extended `src/lib/metricsCalculator.js` — computes all financial metrics client-side
- **Normalizer**: `src/lib/seriesNormalizer.js` — tolerant parser for any JSON format

## What's Been Implemented (2026-04-21)
- [x] Data structure: `src/data/strategies/`, `src/data/benchmarks/`, `registry.js`
- [x] Moved dual-momentum and marot-momentum-v2 data to `src/data/strategies/`
- [x] Created S&P 500 and Nasdaq benchmark data in `src/data/benchmarks/`
- [x] `seriesNormalizer.js` — tolerant normalizer for diverse JSON formats
- [x] Extended metrics: Sortino, Calmar, Info Ratio, Beta, Alpha, Tracking Error, Max DD Duration, % Positive Months, Correlation, Rolling Sharpe, Drawdown series
- [x] 6 chart components: Equity Curve, Drawdown, Rolling Sharpe 12M, Risk/Return Scatter, Monthly Histogram, Metrics Table
- [x] `/quant-strategies` page with full controls (checkboxes, date presets, log/linear, rebase, primary benchmark)
- [x] Export CSV for metrics table
- [x] Export PNG for each chart (ECharts native)
- [x] URL state via query params (shareable URLs)
- [x] Responsive design
- [x] Header and MobileMenu updated with new nav link
- [x] README.md in `src/data/` documenting how to add strategies/benchmarks
- [x] All tests passing (100% frontend)

## Files Created
- `src/data/strategies/dual-momentum.json`
- `src/data/strategies/marot-momentum-v2.json`
- `src/data/strategies/index.js`
- `src/data/benchmarks/sp500.json`
- `src/data/benchmarks/nasdaq.json`
- `src/data/benchmarks/index.js`
- `src/data/registry.js`
- `src/data/README.md`
- `src/lib/seriesNormalizer.js`
- `src/pages/QuantStrategiesPage.jsx`
- `src/components/quant/EquityCurveChart.jsx`
- `src/components/quant/DrawdownChart.jsx`
- `src/components/quant/RollingSharpeChart.jsx`
- `src/components/quant/RiskReturnScatter.jsx`
- `src/components/quant/MonthlyHistogram.jsx`
- `src/components/quant/MetricsTable.jsx`

## Files Modified
- `src/App.jsx` — added route `/quant-strategies`
- `src/components/Header.jsx` — nav link updated
- `src/components/MobileMenu.jsx` — nav link updated
- `src/lib/metricsCalculator.js` — extended with ~300 lines of new metrics

## Backlog
- P1: Custom date range picker (calendar input, not just presets)
- P1: Add more strategies as user provides new JSON data
- P2: Year-over-year returns heatmap visualization
- P2: Monthly returns calendar grid
- P2: Correlation matrix heatmap between all strategies
- P3: PDF report generation
