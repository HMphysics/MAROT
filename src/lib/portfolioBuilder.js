/**
 * Portfolio Builder — Simulation Engine
 *
 * Simulates a weighted portfolio of multiple strategies/benchmarks
 * with periodic rebalancing.
 */

import {
  computeFullMetrics,
  calculateDrawdownSeries,
} from '@/lib/metricsCalculator';

/**
 * Determine if a date string is a rebalance date.
 */
function isRebalanceDate(dateStr, prevDateStr, freq) {
  if (freq === 'never' || !prevDateStr) return false;
  const d = new Date(dateStr);
  const prev = new Date(prevDateStr);
  const m = d.getMonth();
  const pm = prev.getMonth();

  if (freq === 'monthly') return m !== pm;
  if (freq === 'quarterly') return Math.floor(m / 3) !== Math.floor(pm / 3);
  if (freq === 'annually') return d.getFullYear() !== prev.getFullYear();
  return false;
}

/**
 * @param {Object} params
 * @param {Array<{id: string, weight: number, data: Array<{date: string, value: number}>}>} params.components
 * @param {string} params.rebalanceFreq - 'monthly' | 'quarterly' | 'annually' | 'never'
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @returns {Object} { equityCurve, metrics, drawdownSeries, componentCurves }
 */
export function simulatePortfolio({ components, rebalanceFreq, startDate, endDate }) {
  if (!components || components.length === 0) {
    return { error: 'No components provided' };
  }

  // 1. Filter each component's data to the range and build lookup maps
  const lookups = [];
  const allDates = new Set();

  for (const comp of components) {
    let data = comp.data || [];
    if (startDate) data = data.filter((d) => d.date >= startDate);
    if (endDate) data = data.filter((d) => d.date <= endDate);

    const map = new Map();
    for (const p of data) {
      map.set(p.date, p.value);
      allDates.add(p.date);
    }
    lookups.push({ id: comp.id, weight: comp.weight, map });
  }

  // 2. Find common dates (dates where ALL components have data via forward-fill)
  const sortedDates = Array.from(allDates).sort();
  if (sortedDates.length === 0) return { error: 'No overlapping dates' };

  // Find the latest first-date and earliest last-date across all components
  let latestStart = null;
  let earliestEnd = null;
  for (const l of lookups) {
    const dates = Array.from(l.map.keys()).sort();
    if (dates.length === 0) return { error: `Component ${l.id} has no data in range` };
    const first = dates[0];
    const last = dates[dates.length - 1];
    if (!latestStart || first > latestStart) latestStart = first;
    if (!earliestEnd || last < earliestEnd) earliestEnd = last;
  }

  if (latestStart >= earliestEnd) {
    return { error: 'Selected components have no overlapping dates. Try different components or extend the range.' };
  }

  // 3. Build the timeline within the common range, forward-filling each component
  const timeline = sortedDates.filter((d) => d >= latestStart && d <= earliestEnd);
  if (timeline.length < 2) return { error: 'Not enough data points in overlapping range' };

  // Forward-fill each component on the timeline
  const filled = lookups.map((l) => {
    const arr = [];
    let last = null;
    for (const d of timeline) {
      if (l.map.has(d)) last = l.map.get(d);
      arr.push(last);
    }
    return arr;
  });

  // 4. Simulate portfolio
  const n = components.length;
  const legValues = components.map((c) => 100 * (c.weight / 100));
  const equityCurve = [{ date: timeline[0], value: 100 }];

  // Track individual component curves (rebased to their contribution)
  const componentCurves = components.map((c) => [{
    date: timeline[0],
    value: 100 * (c.weight / 100),
  }]);

  for (let t = 1; t < timeline.length; t++) {
    // Calculate returns and update legs
    for (let i = 0; i < n; i++) {
      const prevPrice = filled[i][t - 1];
      const curPrice = filled[i][t];
      if (prevPrice && prevPrice > 0 && curPrice != null) {
        const ret = curPrice / prevPrice - 1;
        legValues[i] *= (1 + ret);
      }
    }

    const portfolioValue = legValues.reduce((sum, v) => sum + v, 0);
    equityCurve.push({ date: timeline[t], value: +portfolioValue.toFixed(4) });

    // Record individual component contributions
    for (let i = 0; i < n; i++) {
      componentCurves[i].push({ date: timeline[t], value: +legValues[i].toFixed(4) });
    }

    // Rebalance if needed
    if (isRebalanceDate(timeline[t], timeline[t - 1], rebalanceFreq)) {
      for (let i = 0; i < n; i++) {
        legValues[i] = portfolioValue * (components[i].weight / 100);
      }
    }
  }

  // 5. Compute metrics using existing functions
  const metrics = computeFullMetrics(equityCurve, null);
  const drawdownSeries = calculateDrawdownSeries(equityCurve);

  // Also compute metrics for each component individually (rebased to 100)
  const componentMetrics = {};
  for (let i = 0; i < n; i++) {
    const compCurve = [];
    let basePrice = null;
    for (let t = 0; t < timeline.length; t++) {
      const price = filled[i][t];
      if (price == null) continue;
      if (!basePrice) basePrice = price;
      compCurve.push({ date: timeline[t], value: (price / basePrice) * 100 });
    }
    componentMetrics[components[i].id] = computeFullMetrics(compCurve, null);
  }

  return {
    equityCurve,
    metrics,
    drawdownSeries,
    componentCurves,
    componentMetrics,
    effectiveRange: { start: latestStart, end: earliestEnd },
    years: ((new Date(earliestEnd) - new Date(latestStart)) / (365.25 * 86400000)).toFixed(1),
  };
}
