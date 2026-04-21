/**
 * Calculates financial metrics from historical price data.
 * @param {Array<{date: string, close: number}>} historicalData - Array of historical data points sorted by date
 * @returns {Object} Calculated metrics
 */
export const calculateSPYMetricsFromHistoricalData = (historicalData) => {
  if (!historicalData || !Array.isArray(historicalData) || historicalData.length < 2) {
    console.warn("Insufficient historical data for SPY metrics calculation");
    return {
      cagr: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      bestYear: 0,
      worstYear: 0,
      totalReturn: 0
    };
  }

  // Ensure data is sorted by date
  const sortedData = [...historicalData].sort((a, b) => new Date(a.date) - new Date(b.date));

  const startPrice = sortedData[0].close;
  const endPrice = sortedData[sortedData.length - 1].close;
  
  // Calculate Total Return
  const totalReturn = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;

  // Calculate CAGR
  const startDate = new Date(sortedData[0].date);
  const endDate = new Date(sortedData[sortedData.length - 1].date);
  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const years = Math.max(daysDiff / 365.25, 0.1); // Avoid division by zero
  
  let cagr = 0;
  if (startPrice > 0 && endPrice > 0) {
    cagr = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
  }

  // Calculate Max Drawdown
  let maxDrawdown = 0;
  let peak = -Infinity;
  
  for (const day of sortedData) {
    if (day.close > peak) {
      peak = day.close;
    }
    
    if (peak > 0) {
      const drawdown = (peak - day.close) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }
  
  // Calculate Sharpe Ratio (Annualized)
  // Using daily returns
  const dailyReturns = [];
  for (let i = 1; i < sortedData.length; i++) {
    const prevClose = sortedData[i-1].close;
    const currClose = sortedData[i].close;
    if (prevClose > 0) {
      dailyReturns.push((currClose - prevClose) / prevClose);
    }
  }

  let sharpeRatio = 0;
  const RISK_FREE_RATE = 0.02; // 2% annual risk-free rate
  const DAILY_RF = Math.pow(1 + RISK_FREE_RATE, 1/252) - 1;

  if (dailyReturns.length > 0) {
    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    
    // Calculate standard deviation
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / (dailyReturns.length - 1);
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > 0) {
      // Annualize Sharpe: (Avg Daily Ret - Daily RF) / Daily StdDev * sqrt(252)
      sharpeRatio = ((avgDailyReturn - DAILY_RF) / stdDev) * Math.sqrt(252);
    }
  }

  // Calculate Best and Worst Year
  const yearReturns = {};
  
  sortedData.forEach(day => {
    const year = new Date(day.date).getFullYear();
    if (!yearReturns[year]) {
      yearReturns[year] = { start: day.close, end: day.close };
    }
    // Update end price as we iterate through chronological data
    yearReturns[year].end = day.close;
    // Keep start price as the first price seen for that year
    if (day.date < new Date(year, 0, 10).toISOString()) { 
       // If it's early in the year, treat as start. 
       // Actually simpler: if we iterate chronologically, the first entry created is the start.
       // The 'start' field set on creation is correct.
    }
  });

  const annualPcts = Object.keys(yearReturns).map(year => {
    const { start, end } = yearReturns[year];
    return start > 0 ? ((end - start) / start) * 100 : 0;
  });

  const bestYear = annualPcts.length > 0 ? Math.max(...annualPcts) : 0;
  const worstYear = annualPcts.length > 0 ? Math.min(...annualPcts) : 0;

  // Defensive formatting to avoid Infinity/NaN
  const safeNum = (n) => (Number.isFinite(n) ? n : 0);

  return {
    cagr: safeNum(cagr),
    maxDrawdown: safeNum(maxDrawdown * 100), // Convert to percentage
    sharpeRatio: safeNum(sharpeRatio),
    bestYear: safeNum(bestYear),
    worstYear: safeNum(worstYear),
    totalReturn: safeNum(totalReturn)
  };
};