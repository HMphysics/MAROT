/**
 * Investment Calculator — Simulation Engine
 *
 * === XIRR (Extended Internal Rate of Return) ===
 * XIRR finds the annualized rate `r` such that the Net Present Value (NPV)
 * of all cash flows equals zero:
 *   NPV = Σ CF_i / (1 + r)^((d_i - d_0) / 365) = 0
 *
 * We solve this using Newton-Raphson iteration:
 *   r_{n+1} = r_n - NPV(r_n) / NPV'(r_n)
 * Starting guess: 0.10 (10%). Max 100 iterations, tolerance 1e-7.
 * If it doesn't converge, returns null.
 *
 * === Money-Weighted Return (MWR) vs Time-Weighted Return (TWR) ===
 * - TWR (CAGR of the strategy) measures the strategy's performance
 *   independent of cash flow timing. It's what the "pure" strategy returned.
 * - MWR (XIRR) measures the investor's actual return, accounting for
 *   when money was added/removed. If you added more money before a dip,
 *   your MWR is worse than TWR; if you added before a rally, it's better.
 *
 * === Why IRR with contributions/withdrawals differs from strategy CAGR ===
 * CAGR assumes a single lump-sum investment at the start. Real investors
 * make periodic contributions/withdrawals, changing the capital base over
 * time. IRR captures this dollar-weighted reality.
 *
 * === Assumptions ===
 * - No taxes, no commissions, no slippage
 * - Inflation fixed at 2% annual (when enabled)
 * - Prices are end-of-day/period; buys/sells execute at the last known price
 * - Fractional units allowed (no rounding to whole shares)
 */

/**
 * XIRR via Newton-Raphson
 * @param {Array<{amount: number, date: Date}>} cashFlows - negative = outflow (investment), positive = inflow (withdrawal/final value)
 * @returns {number|null} annualized rate, or null if doesn't converge
 */
export function calculateXIRR(cashFlows) {
  if (!cashFlows || cashFlows.length < 2) return null;

  const d0 = cashFlows[0].date.getTime();
  const yearFrac = (d) => (d.getTime() - d0) / (365.25 * 86400000);

  const npv = (r) => {
    let sum = 0;
    for (const cf of cashFlows) {
      const t = yearFrac(cf.date);
      sum += cf.amount / Math.pow(1 + r, t);
    }
    return sum;
  };

  const dnpv = (r) => {
    let sum = 0;
    for (const cf of cashFlows) {
      const t = yearFrac(cf.date);
      if (t === 0) continue;
      sum += -t * cf.amount / Math.pow(1 + r, t + 1);
    }
    return sum;
  };

  let r = 0.1;
  for (let i = 0; i < 100; i++) {
    const f = npv(r);
    const df = dnpv(r);
    if (Math.abs(df) < 1e-12) break;
    const rNew = r - f / df;
    if (Math.abs(rNew - r) < 1e-7) return rNew;
    r = rNew;
    if (r < -0.99) r = -0.99;
    if (r > 10) r = 10;
  }
  return null;
}

/**
 * Generate schedule dates for periodic events
 */
function generateScheduleDates(startDate, endDate, frequency, dayOfMonth) {
  const dates = [];
  if (frequency === 'none') return dates;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const day = Math.min(dayOfMonth || 1, 28);

  let current = new Date(start.getFullYear(), start.getMonth(), day);
  if (current <= start) {
    // Move to next period
    if (frequency === 'monthly') current.setMonth(current.getMonth() + 1);
    else if (frequency === 'quarterly') current.setMonth(current.getMonth() + 3);
    else if (frequency === 'annual') current.setFullYear(current.getFullYear() + 1);
  }

  const increment = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : 12;

  while (current <= end) {
    dates.push(new Date(current));
    current = new Date(current.getFullYear(), current.getMonth() + increment, day);
  }

  return dates;
}

/**
 * Find the last known price <= targetDate from a sorted series
 */
function findPrice(series, targetDateStr) {
  const target = targetDateStr;
  let lastPrice = null;
  for (const p of series) {
    if (p.date > target) break;
    lastPrice = p.value;
  }
  return lastPrice;
}

/**
 * Inflation factor: (1 + rate)^years
 */
function inflationFactor(startDate, currentDate, annualRate) {
  const years = (currentDate.getTime() - startDate.getTime()) / (365.25 * 86400000);
  return Math.pow(1 + annualRate, years);
}

/**
 * Frequency to annual divisor
 */
function freqDivisor(freq) {
  if (freq === 'monthly') return 12;
  if (freq === 'quarterly') return 4;
  return 1;
}

/**
 * Main simulation function
 * @param {Object} params
 * @param {Object} params.series - {date, value}[] sorted
 * @param {string} params.mode - 'accumulation' | 'withdrawal' | 'mixed'
 * @param {number} params.initialAmount
 * @param {string} params.startDate - ISO date
 * @param {string} params.endDate - ISO date
 * @param {Object} params.contributions - { amount, frequency, dayOfMonth, adjustInflation }
 * @param {Object} params.withdrawals - { type: 'fixed'|'pct_initial'|'pct_current', amount, frequency, dayOfMonth, adjustInflation }
 * @param {string} [params.contributionEndDate] - for mixed mode
 * @param {number} [params.inflationRate] - default 0.02
 * @returns {Object} simulation results
 */
export function simulateInvestment(params) {
  const {
    series, mode, initialAmount, startDate, endDate,
    contributions = {}, withdrawals = {},
    contributionEndDate, inflationRate = 0.02,
  } = params;

  if (!series || series.length < 2) {
    return { error: 'Insufficient data' };
  }

  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Find initial price
  const initPrice = findPrice(sorted, startDate);
  if (!initPrice || initPrice === 0) {
    return { error: 'No price data at start date' };
  }

  // Initial purchase
  let units = initialAmount / initPrice;
  let totalInvested = initialAmount;
  let totalWithdrawn = 0;
  let depletedDate = null;

  // Cash flows for XIRR (negative = money out, positive = money in)
  const cashFlows = [{ amount: -initialAmount, date: start }];

  // Generate contribution schedule
  const contribEndDate = mode === 'mixed' && contributionEndDate
    ? contributionEndDate
    : endDate;
  const contribDates = (mode === 'accumulation' || mode === 'mixed') && contributions.frequency !== 'none'
    ? generateScheduleDates(startDate, contribEndDate, contributions.frequency, contributions.dayOfMonth)
    : [];

  // Generate withdrawal schedule
  const withdrawStartDate = mode === 'mixed' && contributionEndDate
    ? contributionEndDate
    : startDate;
  const withdrawDates = (mode === 'withdrawal' || mode === 'mixed') && withdrawals.frequency !== 'none'
    ? generateScheduleDates(withdrawStartDate, endDate, withdrawals.frequency, withdrawals.dayOfMonth)
    : [];

  // Merge all event dates + series dates into a timeline
  const eventMap = new Map(); // dateStr -> [{type, ...}]

  for (const d of contribDates) {
    const ds = d.toISOString().split('T')[0];
    if (!eventMap.has(ds)) eventMap.set(ds, []);
    eventMap.get(ds).push({ type: 'contribute', date: d });
  }

  for (const d of withdrawDates) {
    const ds = d.toISOString().split('T')[0];
    if (!eventMap.has(ds)) eventMap.set(ds, []);
    eventMap.get(ds).push({ type: 'withdraw', date: d });
  }

  // Build timeline: all series dates + event dates within range
  const timelineDates = new Set();
  for (const p of sorted) {
    if (p.date >= startDate && p.date <= endDate) timelineDates.add(p.date);
  }
  for (const ds of eventMap.keys()) {
    if (ds >= startDate && ds <= endDate) timelineDates.add(ds);
  }

  const timeline = Array.from(timelineDates).sort();
  const history = []; // {date, portfolioValue, netInvested}
  let peak = initialAmount;
  let maxDD = 0;

  for (const dateStr of timeline) {
    const price = findPrice(sorted, dateStr);
    if (!price) continue;

    // Process events on this date
    const events = eventMap.get(dateStr) || [];
    for (const evt of events) {
      if (depletedDate) break;

      if (evt.type === 'contribute') {
        let amount = contributions.amount || 0;
        if (contributions.adjustInflation) {
          amount *= inflationFactor(start, evt.date, inflationRate);
        }
        const newUnits = amount / price;
        units += newUnits;
        totalInvested += amount;
        cashFlows.push({ amount: -amount, date: evt.date });
      }

      if (evt.type === 'withdraw') {
        let amount = 0;
        const currentValue = units * price;
        const fd = freqDivisor(withdrawals.frequency);

        if (withdrawals.type === 'fixed') {
          amount = (withdrawals.amount || 0);
          if (withdrawals.adjustInflation) {
            amount *= inflationFactor(start, evt.date, inflationRate);
          }
        } else if (withdrawals.type === 'pct_initial') {
          const annualAmount = initialAmount * ((withdrawals.amount || 4) / 100);
          amount = annualAmount / fd;
          if (withdrawals.adjustInflation) {
            amount *= inflationFactor(start, evt.date, inflationRate);
          }
        } else if (withdrawals.type === 'pct_current') {
          const annualAmount = currentValue * ((withdrawals.amount || 4) / 100);
          amount = annualAmount / fd;
        }

        const unitsToSell = amount / price;
        if (unitsToSell >= units) {
          // Portfolio depleted
          const actualAmount = units * price;
          totalWithdrawn += actualAmount;
          cashFlows.push({ amount: actualAmount, date: evt.date });
          units = 0;
          depletedDate = dateStr;
        } else {
          units -= unitsToSell;
          totalWithdrawn += amount;
          cashFlows.push({ amount: amount, date: evt.date });
        }
      }
    }

    // Record state
    const portfolioValue = units * price;
    const netInvested = totalInvested - totalWithdrawn;

    // Max drawdown
    if (portfolioValue > peak) peak = portfolioValue;
    const dd = peak > 0 ? (portfolioValue - peak) / peak : 0;
    if (dd < maxDD) maxDD = dd;

    history.push({ date: dateStr, portfolioValue: +portfolioValue.toFixed(2), netInvested: +netInvested.toFixed(2) });
  }

  // Final value
  const finalValue = history.length > 0 ? history[history.length - 1].portfolioValue : 0;

  // Add final value as cash inflow for XIRR
  if (finalValue > 0) {
    cashFlows.push({ amount: finalValue, date: end });
  }

  // Calculate XIRR
  const irr = calculateXIRR(cashFlows);

  // Total return
  const netProfit = finalValue + totalWithdrawn - totalInvested;
  const totalReturnPct = totalInvested > 0 ? netProfit / totalInvested : 0;

  // Duration
  const durationYears = (end - start) / (365.25 * 86400000);
  const yearsLasted = depletedDate
    ? (new Date(depletedDate) - start) / (365.25 * 86400000)
    : durationYears;

  return {
    totalInvested: +totalInvested.toFixed(2),
    totalWithdrawn: +totalWithdrawn.toFixed(2),
    finalValue: +finalValue.toFixed(2),
    depletedDate,
    netProfit: +netProfit.toFixed(2),
    totalReturnPct,
    irr,
    maxDD,
    durationYears: +durationYears.toFixed(2),
    yearsLasted: +yearsLasted.toFixed(2),
    survived: !depletedDate,
    history,
    cashFlows,
  };
}
