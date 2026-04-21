function stdDev(arr) {
  const n = arr.length;
  if (n < 2) return 0;
  const mean = arr.reduce((a, b) => a + b) / n;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

function sortinoRatio(returns, riskFreeRate = 0) {
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < riskFreeRate);
    if (downsideReturns.length < 2) return 0;
    const downsideDeviation = Math.sqrt(downsideReturns.reduce((acc, r) => acc + (r - riskFreeRate) ** 2, 0) / downsideReturns.length);
    return downsideDeviation === 0 ? 0 : (meanReturn - riskFreeRate) / downsideDeviation;
}

export function calculatePerformanceMetrics(data) {
  if (!data || data.length === 0) throw new Error("No data provided");
  
  const headers = Object.keys(data[0]);
  if (headers.length < 2) throw new Error("Data must have at least two columns.");

  const dateKey = headers[0];
  const gdaKey = headers[1];
  const benchmarkKey = headers.length > 2 ? headers[2] : null;
  
  const parsedData = data.map(row => ({
    date: new Date(row[dateKey]),
    gdaReturn: parseFloat(row[gdaKey]) || 0,
    benchmarkReturn: benchmarkKey ? (parseFloat(row[benchmarkKey]) || 0) : 0,
  })).sort((a, b) => a.date - b.date);

  const gdaReturns = parsedData.map(d => d.gdaReturn);
  const benchmarkReturns = parsedData.map(d => d.benchmarkReturn);

  // Portfolio Growth
  let gdaBalance = 10000;
  let benchmarkBalance = 10000;
  let gdaPeak = gdaBalance;
  let benchmarkPeak = benchmarkBalance;
  let gdaMaxDrawdown = 0;
  let benchmarkMaxDrawdown = 0;

  const portfolioGrowth = {
    dates: [],
    gda: [],
    benchmark: [],
  };
  
  parsedData.forEach(d => {
    portfolioGrowth.dates.push(d.date.toISOString().split('T')[0]);
    
    gdaBalance *= (1 + d.gdaReturn);
    portfolioGrowth.gda.push(gdaBalance);
    if (gdaBalance > gdaPeak) gdaPeak = gdaBalance;
    gdaMaxDrawdown = Math.min(gdaMaxDrawdown, (gdaBalance - gdaPeak) / gdaPeak);

    benchmarkBalance *= (1 + d.benchmarkReturn);
    portfolioGrowth.benchmark.push(benchmarkBalance);
    if (benchmarkBalance > benchmarkPeak) benchmarkPeak = benchmarkBalance;
    benchmarkMaxDrawdown = Math.min(benchmarkMaxDrawdown, (benchmarkBalance - benchmarkPeak) / benchmarkPeak);
  });

  const years = (parsedData[parsedData.length - 1].date - parsedData[0].date) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Annual stats
  const annualReturns = {};
  parsedData.forEach(d => {
    const year = d.date.getFullYear();
    if (!annualReturns[year]) annualReturns[year] = { gda: [], benchmark: [] };
    annualReturns[year].gda.push(d.gdaReturn);
    annualReturns[year].benchmark.push(d.benchmarkReturn);
  });
  
  const yearlyPerformance = Object.entries(annualReturns).map(([year, returns]) => ({
    year,
    gda: returns.gda.reduce((acc, r) => acc * (1 + r), 1) - 1,
    benchmark: returns.benchmark.reduce((acc, r) => acc * (1 + r), 1) - 1,
  }));

  const gdaYearlyReturns = yearlyPerformance.map(y => y.gda);
  const benchmarkYearlyReturns = yearlyPerformance.map(y => y.benchmark);

  // Summary
  const summary = {
    gda: {
      startBalance: 10000,
      endBalance: gdaBalance,
      cagr: years > 0 ? (gdaBalance / 10000) ** (1 / years) - 1 : 0,
      stdDev: stdDev(gdaReturns) * Math.sqrt(12),
      bestYear: Math.max(...gdaYearlyReturns, -Infinity),
      worstYear: Math.min(...gdaYearlyReturns, Infinity),
      maxDrawdown: gdaMaxDrawdown,
      sharpeRatio: ((gdaReturns.reduce((a, b) => a + b) / gdaReturns.length) * 12) / (stdDev(gdaReturns) * Math.sqrt(12)) || 0,
      sortinoRatio: sortinoRatio(gdaReturns) * Math.sqrt(12),
      correlation: 1,
    },
    benchmark: {
      startBalance: 10000,
      endBalance: benchmarkBalance,
      cagr: years > 0 ? (benchmarkBalance / 10000) ** (1 / years) - 1 : 0,
      stdDev: stdDev(benchmarkReturns) * Math.sqrt(12),
      bestYear: Math.max(...benchmarkYearlyReturns, -Infinity),
      worstYear: Math.min(...benchmarkYearlyReturns, Infinity),
      maxDrawdown: benchmarkMaxDrawdown,
      sharpeRatio: ((benchmarkReturns.reduce((a,b) => a+b)/benchmarkReturns.length)*12) / (stdDev(benchmarkReturns)*Math.sqrt(12)) || 0,
      sortinoRatio: sortinoRatio(benchmarkReturns) * Math.sqrt(12),
    },
  };
  
  // Correlation
  if (benchmarkKey) {
    const meanGDA = gdaReturns.reduce((s, v) => s + v, 0) / gdaReturns.length;
    const meanBenchmark = benchmarkReturns.reduce((s, v) => s + v, 0) / benchmarkReturns.length;
    let cov = 0, varGDA = 0, varBenchmark = 0;
    for (let i = 0; i < gdaReturns.length; i++) {
      cov += (gdaReturns[i] - meanGDA) * (benchmarkReturns[i] - meanBenchmark);
      varGDA += (gdaReturns[i] - meanGDA) ** 2;
      varBenchmark += (benchmarkReturns[i] - meanBenchmark) ** 2;
    }
    summary.gda.correlation = cov / Math.sqrt(varGDA * varBenchmark) || 0;
  }


  // Trailing Returns
  const trailing = {
    gda: { returns: {}, stdDev: {} },
    benchmark: { returns: {}, stdDev: {} },
  };

  const today = parsedData[parsedData.length-1].date;
  const periods = { '3 Month': 3, 'YTD': today.getMonth() + 1, '1 year': 12, '3 year': 36, '5 year': 60, '10 year': 120 };

  for (const [label, months] of Object.entries(periods)) {
    if (parsedData.length >= months) {
      const trailingData = parsedData.slice(-months);
      const gdaTrailingReturns = trailingData.map(d => d.gdaReturn);
      const benchmarkTrailingReturns = trailingData.map(d => d.benchmarkReturn);

      trailing.gda.returns[label] = gdaTrailingReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
      trailing.benchmark.returns[label] = benchmarkTrailingReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
      
      if (label.includes('year')) {
        const annualizationFactor = 12 / months;
        trailing.gda.returns[label] = (1 + trailing.gda.returns[label]) ** annualizationFactor - 1;
        trailing.benchmark.returns[label] = (1 + trailing.benchmark.returns[label]) ** annualizationFactor - 1;
        
        trailing.gda.stdDev[label] = stdDev(gdaTrailingReturns) * Math.sqrt(12);
        trailing.benchmark.stdDev[label] = stdDev(benchmarkTrailingReturns) * Math.sqrt(12);
      }
    } else {
        trailing.gda.returns[label] = 0;
        trailing.benchmark.returns[label] = 0;
        if (label.includes('year')) {
            trailing.gda.stdDev[label] = 0;
            trailing.benchmark.stdDev[label] = 0;
        }
    }
  }
  trailing.gda.returns['Full'] = summary.gda.cagr;
  trailing.benchmark.returns['Full'] = summary.benchmark.cagr;

  return { portfolioGrowth, summary, trailing };
}