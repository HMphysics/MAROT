/**
 * Calculates daily percentage returns from a series of values.
 * @param {Array<{date: string, value: number}>} equityCurve
 * @returns {Array<{date: string, return: number}>}
 */
export const calculateDailyReturns = (equityCurve) => {
  if (!equityCurve || !Array.isArray(equityCurve) || equityCurve.length < 2) {
    return [];
  }

  // Ensure sorted by date
  const sorted = [...equityCurve].sort((a, b) => new Date(a.date || a.Date) - new Date(b.date || b.Date));
  const returns = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].value !== undefined ? sorted[i - 1].value : sorted[i - 1].equity;
    const curr = sorted[i].value !== undefined ? sorted[i].value : sorted[i].equity;
    
    // Handle edge cases
    if (prev !== 0 && prev !== null && !isNaN(prev) && curr !== null && !isNaN(curr)) {
      const dailyRet = (curr - prev) / prev;
      returns.push(dailyRet);
    }
  }

  return returns;
};

export const calculateTotalReturn = (equityInitial, equityFinal) => {
  if (!equityInitial || equityInitial === 0) return 0;
  return (equityFinal / equityInitial) - 1;
};

export const calculateCAGR = (equityInitial, equityFinal, years) => {
  if (!equityInitial || equityInitial === 0 || !years || years === 0) return 0;
  if (equityFinal / equityInitial <= 0) return -1;
  // Handle case where years < 1 (extrapolation risk). 
  if (years < 0.1) return 0; 
  return Math.pow(equityFinal / equityInitial, 1 / years) - 1;
};

export const calculateMaxDrawdown = (equityCurve) => {
  if (!equityCurve || equityCurve.length === 0) return 0;
  let peak = -Infinity;
  let maxDrawdown = 0;

  for (const point of equityCurve) {
    const value = point.value !== undefined ? point.value : point.equity;
    if (value > peak) {
      peak = value;
    }
    if (peak > 0) {
      const drawdown = (value / peak) - 1;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }
  return maxDrawdown; // Returns negative value like -0.20
};

export const calculateBestWorstYear = (equityCurve) => {
    if (!equityCurve || equityCurve.length === 0) return { bestYear: 0, worstYear: 0 };
    
    const yearGroups = {};
    equityCurve.forEach(p => {
        if (!p.date && !p.Date) return;
        const d = new Date(p.date || p.Date);
        const y = d.getFullYear();
        if(!yearGroups[y]) yearGroups[y] = [];
        yearGroups[y].push(p);
    });
    
    const sortedYears = Object.keys(yearGroups).sort();
    const annualReturns = [];
    
    sortedYears.forEach((year, index) => {
        const yearData = yearGroups[year];
        yearData.sort((a, b) => new Date(a.date || a.Date) - new Date(b.date || b.Date));
        
        const yearEnd = yearData[yearData.length - 1];
        const yearEndValue = yearEnd.value !== undefined ? yearEnd.value : yearEnd.equity;
        
        let yearStartValue;
        
        if (index === 0) {
            const yearStart = yearData[0];
            yearStartValue = yearStart.value !== undefined ? yearStart.value : yearStart.equity;
        } else {
            const prevYear = sortedYears[index - 1];
            const prevYearData = yearGroups[prevYear];
            // Ensure previous year is sorted
            prevYearData.sort((a, b) => new Date(a.date || a.Date) - new Date(b.date || b.Date));
            const prevYearEnd = prevYearData[prevYearData.length - 1];
            yearStartValue = prevYearEnd.value !== undefined ? prevYearEnd.value : prevYearEnd.equity;
        }
        
        if (yearStartValue && yearStartValue > 0) {
            const ret = (yearEndValue / yearStartValue) - 1;
            annualReturns.push(ret);
        }
    });
    
    if (annualReturns.length === 0) return { bestYear: 0, worstYear: 0 };
    
    return {
        bestYear: Math.max(...annualReturns),
        worstYear: Math.min(...annualReturns)
    };
};

// Monthly Sharpe Calculation
export const calculateMonthlySharpe = (equityCurve) => {
  if (!equityCurve || equityCurve.length < 2) return 0;

  // 1. Sort equity curve by date (Oldest to Newest)
  const sorted = [...equityCurve].sort((a, b) => new Date(a.date || a.Date) - new Date(b.date || b.Date));

  // Resample to Monthly Data (End of Month)
  const monthMap = new Map();
  sorted.forEach(item => {
    const d = new Date(item.date || item.Date);
    if (isNaN(d.getTime())) return;
    
    // Key format: "YYYY-MM"
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const val = item.value !== undefined ? Number(item.value) : 
                (item.close !== undefined ? Number(item.close) : 
                (item.Close !== undefined ? Number(item.Close) : 
                (item.equity !== undefined ? Number(item.equity) : 0)));
    
    // Always update with the latest date found for this month (traversing sorted array)
    monthMap.set(key, { date: d, value: val });
  });

  const monthlyData = Array.from(monthMap.values()).sort((a, b) => a.date - b.date);

  // Edge case: equityCurve has < 3 points (months in this case)
  if (monthlyData.length < 3) return 0;

  // 2. Calculate monthly returns
  const returns = [];
  for (let i = 1; i < monthlyData.length; i++) {
    const prev = monthlyData[i - 1].value;
    const curr = monthlyData[i].value;
    if (prev > 0) {
      // Formula: r = equity[i] / equity[i-1] - 1
      const r = (curr / prev) - 1;
      returns.push(r);
    }
  }

  if (returns.length < 2) return 0;

  // 3. Compute mean of returns
  const sumReturns = returns.reduce((acc, val) => acc + val, 0);
  const mean = sumReturns / returns.length;

  // 4. Calculate variance (sample variance n-1)
  const sumSquaredDiffs = returns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const variance = sumSquaredDiffs / (returns.length - 1);

  // 5. Calculate standard deviation
  const stdev = Math.sqrt(variance);

  // Edge case: stdev is 0
  if (stdev === 0) return 0;

  // 6. Annualized Sharpe: (mean / stdev) * √12
  return (mean / stdev) * Math.sqrt(12);
};

// === EXTENDED METRICS for Quant Strategies ===

/**
 * Monthly returns from {date, value}[] series
 */
export const calculateMonthlyReturns = (series) => {
  if (!series || series.length < 2) return [];
  const sorted = [...series].sort((a, b) => new Date(a.date) - new Date(b.date));
  const monthMap = new Map();
  sorted.forEach((item) => {
    const d = new Date(item.date || item.Date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const val = item.value !== undefined ? Number(item.value) : Number(item.equity || item.close || 0);
    monthMap.set(key, { date: d, value: val });
  });
  const monthly = Array.from(monthMap.values()).sort((a, b) => a.date - b.date);
  const returns = [];
  for (let i = 1; i < monthly.length; i++) {
    if (monthly[i - 1].value > 0) {
      returns.push({
        date: monthly[i].date,
        ret: (monthly[i].value / monthly[i - 1].value) - 1,
      });
    }
  }
  return returns;
};

/**
 * Annualized volatility from {date, value}[] (uses monthly returns)
 */
export const calculateAnnualizedVol = (series) => {
  const monthly = calculateMonthlyReturns(series);
  if (monthly.length < 2) return 0;
  const rets = monthly.map((m) => m.ret);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(12);
};

/**
 * Sortino Ratio (annualized, monthly data)
 */
export const calculateSortino = (series, riskFreeAnnual = 0.02) => {
  const monthly = calculateMonthlyReturns(series);
  if (monthly.length < 2) return 0;
  const rets = monthly.map((m) => m.ret);
  const rfMonthly = Math.pow(1 + riskFreeAnnual, 1 / 12) - 1;
  const meanExcess = rets.reduce((a, b) => a + b, 0) / rets.length - rfMonthly;
  const downside = rets.filter((r) => r < rfMonthly);
  if (downside.length < 1) return meanExcess > 0 ? Infinity : 0;
  const downsideDev = Math.sqrt(
    downside.reduce((a, r) => a + Math.pow(r - rfMonthly, 2), 0) / downside.length
  );
  if (downsideDev === 0) return 0;
  return (meanExcess / downsideDev) * Math.sqrt(12);
};

/**
 * Calmar Ratio = CAGR / |Max Drawdown|
 */
export const calculateCalmar = (series) => {
  if (!series || series.length < 2) return 0;
  const sorted = [...series].sort((a, b) => new Date(a.date) - new Date(b.date));
  const startVal = sorted[0].value;
  const endVal = sorted[sorted.length - 1].value;
  const years = (new Date(sorted[sorted.length - 1].date) - new Date(sorted[0].date)) / (365.25 * 86400000);
  if (years <= 0 || startVal <= 0) return 0;
  const cagr = Math.pow(endVal / startVal, 1 / years) - 1;
  const maxDD = Math.abs(calculateMaxDrawdown(sorted));
  if (maxDD === 0) return 0;
  return cagr / maxDD;
};

/**
 * Max Drawdown Duration in days
 */
export const calculateMaxDDDuration = (series) => {
  if (!series || series.length < 2) return 0;
  const sorted = [...series].sort((a, b) => new Date(a.date) - new Date(b.date));
  let peak = sorted[0].value;
  let peakDate = new Date(sorted[0].date);
  let maxDuration = 0;

  for (const p of sorted) {
    const val = p.value !== undefined ? p.value : p.equity;
    if (val >= peak) {
      peak = val;
      peakDate = new Date(p.date);
    } else {
      const dur = (new Date(p.date) - peakDate) / 86400000;
      if (dur > maxDuration) maxDuration = dur;
    }
  }
  return Math.round(maxDuration);
};

/**
 * % Positive Months
 */
export const calculatePositiveMonths = (series) => {
  const monthly = calculateMonthlyReturns(series);
  if (monthly.length === 0) return 0;
  const positive = monthly.filter((m) => m.ret > 0).length;
  return (positive / monthly.length) * 100;
};

/**
 * Beta relative to a benchmark series
 */
export const calculateBeta = (strategySeries, benchmarkSeries) => {
  const sMonthly = calculateMonthlyReturns(strategySeries);
  const bMonthly = calculateMonthlyReturns(benchmarkSeries);
  if (sMonthly.length < 3 || bMonthly.length < 3) return 0;

  // Align by month key
  const sMap = new Map();
  sMonthly.forEach((m) => {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`;
    sMap.set(key, m.ret);
  });

  const aligned = [];
  bMonthly.forEach((m) => {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`;
    if (sMap.has(key)) {
      aligned.push({ s: sMap.get(key), b: m.ret });
    }
  });

  if (aligned.length < 3) return 0;
  const meanS = aligned.reduce((a, p) => a + p.s, 0) / aligned.length;
  const meanB = aligned.reduce((a, p) => a + p.b, 0) / aligned.length;
  let cov = 0, varB = 0;
  for (const p of aligned) {
    cov += (p.s - meanS) * (p.b - meanB);
    varB += (p.b - meanB) ** 2;
  }
  return varB === 0 ? 0 : cov / varB;
};

/**
 * Alpha = (Strategy CAGR) - (RiskFree + Beta * (Benchmark CAGR - RiskFree))
 */
export const calculateAlpha = (strategySeries, benchmarkSeries, riskFreeAnnual = 0.02) => {
  const beta = calculateBeta(strategySeries, benchmarkSeries);
  const getCAGR = (series) => {
    if (!series || series.length < 2) return 0;
    const sorted = [...series].sort((a, b) => new Date(a.date) - new Date(b.date));
    const startVal = sorted[0].value;
    const endVal = sorted[sorted.length - 1].value;
    const years = (new Date(sorted[sorted.length - 1].date) - new Date(sorted[0].date)) / (365.25 * 86400000);
    if (years <= 0 || startVal <= 0) return 0;
    return Math.pow(endVal / startVal, 1 / years) - 1;
  };
  const sCAGR = getCAGR(strategySeries);
  const bCAGR = getCAGR(benchmarkSeries);
  return sCAGR - (riskFreeAnnual + beta * (bCAGR - riskFreeAnnual));
};

/**
 * Tracking Error (annualized std of return differences)
 */
export const calculateTrackingError = (strategySeries, benchmarkSeries) => {
  const sMonthly = calculateMonthlyReturns(strategySeries);
  const bMonthly = calculateMonthlyReturns(benchmarkSeries);
  if (sMonthly.length < 3 || bMonthly.length < 3) return 0;

  const sMap = new Map();
  sMonthly.forEach((m) => {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`;
    sMap.set(key, m.ret);
  });

  const diffs = [];
  bMonthly.forEach((m) => {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`;
    if (sMap.has(key)) {
      diffs.push(sMap.get(key) - m.ret);
    }
  });

  if (diffs.length < 2) return 0;
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (diffs.length - 1);
  return Math.sqrt(variance) * Math.sqrt(12);
};

/**
 * Information Ratio = (Strategy CAGR - Benchmark CAGR) / Tracking Error
 */
export const calculateInformationRatio = (strategySeries, benchmarkSeries) => {
  const te = calculateTrackingError(strategySeries, benchmarkSeries);
  if (te === 0) return 0;
  const getCAGR = (series) => {
    if (!series || series.length < 2) return 0;
    const sorted = [...series].sort((a, b) => new Date(a.date) - new Date(b.date));
    const startVal = sorted[0].value;
    const endVal = sorted[sorted.length - 1].value;
    const years = (new Date(sorted[sorted.length - 1].date) - new Date(sorted[0].date)) / (365.25 * 86400000);
    if (years <= 0 || startVal <= 0) return 0;
    return Math.pow(endVal / startVal, 1 / years) - 1;
  };
  return (getCAGR(strategySeries) - getCAGR(benchmarkSeries)) / te;
};

/**
 * Correlation between two series (monthly returns)
 */
export const calculateCorrelation = (seriesA, seriesB) => {
  const aMonthly = calculateMonthlyReturns(seriesA);
  const bMonthly = calculateMonthlyReturns(seriesB);
  if (aMonthly.length < 3 || bMonthly.length < 3) return 0;

  const aMap = new Map();
  aMonthly.forEach((m) => {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`;
    aMap.set(key, m.ret);
  });

  const aligned = [];
  bMonthly.forEach((m) => {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`;
    if (aMap.has(key)) aligned.push({ a: aMap.get(key), b: m.ret });
  });

  if (aligned.length < 3) return 0;
  const meanA = aligned.reduce((acc, p) => acc + p.a, 0) / aligned.length;
  const meanB = aligned.reduce((acc, p) => acc + p.b, 0) / aligned.length;
  let cov = 0, varA = 0, varB = 0;
  for (const p of aligned) {
    cov += (p.a - meanA) * (p.b - meanB);
    varA += (p.a - meanA) ** 2;
    varB += (p.b - meanB) ** 2;
  }
  const denom = Math.sqrt(varA * varB);
  return denom === 0 ? 0 : cov / denom;
};

/**
 * Rolling Sharpe (12-month window) from {date, value}[]
 * Returns [{date, sharpe}]
 */
export const calculateRollingSharpe = (series, windowMonths = 12) => {
  const monthly = calculateMonthlyReturns(series);
  if (monthly.length < windowMonths + 1) return [];

  const results = [];
  for (let i = windowMonths; i < monthly.length; i++) {
    const window = monthly.slice(i - windowMonths, i);
    const rets = window.map((m) => m.ret);
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (rets.length - 1);
    const std = Math.sqrt(variance);
    const sharpe = std === 0 ? 0 : (mean / std) * Math.sqrt(12);
    results.push({
      date: monthly[i].date.toISOString().split('T')[0],
      sharpe,
    });
  }
  return results;
};

/**
 * Drawdown series from {date, value}[]
 * Returns [{date, drawdown}] where drawdown is negative (e.g. -0.15 = -15%)
 */
export const calculateDrawdownSeries = (series) => {
  if (!series || series.length === 0) return [];
  const sorted = [...series].sort((a, b) => new Date(a.date) - new Date(b.date));
  let peak = sorted[0].value;
  return sorted.map((p) => {
    const val = p.value !== undefined ? p.value : p.equity;
    if (val > peak) peak = val;
    return {
      date: p.date,
      drawdown: peak > 0 ? (val - peak) / peak : 0,
    };
  });
};

/**
 * Compute full metrics for a single series, optionally vs benchmark
 */
export const computeFullMetrics = (series, benchmarkSeries = null) => {
  if (!series || series.length < 2) return null;
  const sorted = [...series].sort((a, b) => new Date(a.date) - new Date(b.date));
  const startVal = sorted[0].value;
  const endVal = sorted[sorted.length - 1].value;
  const years = (new Date(sorted[sorted.length - 1].date) - new Date(sorted[0].date)) / (365.25 * 86400000);

  const cagr = years > 0 && startVal > 0 ? Math.pow(endVal / startVal, 1 / years) - 1 : 0;
  const totalReturn = startVal > 0 ? (endVal / startVal) - 1 : 0;
  const vol = calculateAnnualizedVol(sorted);
  const sharpe = calculateMonthlySharpe(sorted);
  const sortino = calculateSortino(sorted);
  const calmar = calculateCalmar(sorted);
  const maxDD = calculateMaxDrawdown(sorted);
  const maxDDDuration = calculateMaxDDDuration(sorted);
  const { bestYear, worstYear } = calculateBestWorstYear(sorted);
  const positiveMonths = calculatePositiveMonths(sorted);

  const result = {
    cagr,
    totalReturn,
    vol,
    sharpe,
    sortino,
    calmar,
    maxDD,
    maxDDDuration,
    bestYear,
    worstYear,
    positiveMonths,
  };

  if (benchmarkSeries && benchmarkSeries.length >= 2) {
    result.beta = calculateBeta(sorted, benchmarkSeries);
    result.alpha = calculateAlpha(sorted, benchmarkSeries);
    result.correlation = calculateCorrelation(sorted, benchmarkSeries);
    result.trackingError = calculateTrackingError(sorted, benchmarkSeries);
    result.infoRatio = calculateInformationRatio(sorted, benchmarkSeries);
  }

  return result;
};
