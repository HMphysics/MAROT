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
  const sorted = [...equityCurve].sort((a, b) => new Date(a.date) - new Date(b.date));
  const returns = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].value;
    const curr = sorted[i].value;
    
    // Handle edge cases
    if (prev !== 0 && prev !== null && !isNaN(prev) && curr !== null && !isNaN(curr)) {
      const dailyRet = (curr - prev) / prev;
      returns.push({
        date: sorted[i].date,
        return: dailyRet
      });
    }
  }

  return returns;
};

/**
 * Calculates the Annualized Sharpe Ratio using daily returns.
 * Formula: (AnnualizedReturn - RiskFreeRate) / AnnualizedVolatility
 * 
 * @param {Array<{date: string, return: number}>} dailyReturns 
 * @param {number} riskFreeRate - Annual risk free rate (default 0.04)
 * @returns {number} Annualized Sharpe Ratio
 */
export const calculateSharpeRatio = (dailyReturns, riskFreeRate = 0.04) => {
  if (!dailyReturns || dailyReturns.length < 2) return 0;

  // Extract return values
  const values = dailyReturns.map(d => d.return);

  // 1. Calculate Mean Daily Return
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  
  // 2. Calculate Standard Deviation (Sample)
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const sumSquaredDiffs = squaredDiffs.reduce((acc, val) => acc + val, 0);
  const variance = sumSquaredDiffs / (values.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0; 

  // 3. Annualize Components
  // Note: Standard simple Sharpe often uses Arithmetic Mean annualization
  const annualizedVol = stdDev * Math.sqrt(252);
  const annualizedReturn = mean * 252;

  // 4. Calculate Ratio
  return (annualizedReturn - riskFreeRate) / annualizedVol;
};

export const calculateAnnualizedVolatility = (dailyReturns) => {
  if (!dailyReturns || dailyReturns.length < 2) return 0;
  
  const values = dailyReturns.map(d => d.return);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
  
  return Math.sqrt(variance) * Math.sqrt(252);
};