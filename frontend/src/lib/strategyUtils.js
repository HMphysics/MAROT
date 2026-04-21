import { calculateDailyReturns } from './metricsCalculator';

export const calculateStrategyMetrics = (data, strategyKey) => {
  if (!data || (!data.performanceSummary && !data.performance_summary)) return null;

  // Handle both camelCase and snake_case property names
  const modelSummary = data.performanceSummary?.[strategyKey] || 
                      data.performanceSummary || 
                      data.performance_summary?.[strategyKey] || 
                      data.performance_summary;

  const benchSummary = data.performanceSummary?.Vanguard500Index || 
                       data.performance_summary?.Vanguard500Index;

  if (!modelSummary) return null;

  const formatPercent = (val) => val != null && !isNaN(val) && isFinite(val) ? `${val.toFixed(2)}%` : 'N/A';
  const formatNumber = (val) => val != null && !isNaN(val) && isFinite(val) ? val.toFixed(2) : 'N/A';
  
  const getVal = (obj, keys) => {
      if (!obj) return null;
      for (const k of keys) {
          if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
      }
      return null;
  };

  const cagr = getVal(modelSummary, ['CAGR', 'annualized_return_cagr', 'cagr']);
  const maxDD = getVal(modelSummary, ['MaxDrawdown', 'max_drawdown', 'drawdown']);
  
  // Read sharpe directly from JSON data
  const sharpeVal = getVal(modelSummary, ['SharpeRatio', 'sharpe_ratio', 'sharpe', 'Sharpe Ratio', 'Sharpe']);
  const sharpe = sharpeVal !== null ? sharpeVal : 0;
  
  const bestY = getVal(modelSummary, ['BestYear', 'best_year']);
  const worstY = getVal(modelSummary, ['WorstYear', 'worst_year']);
  const endBal = getVal(modelSummary, ['EndBalance', 'end_balance']);
  
  let totalRet = getVal(modelSummary, ['TotalReturn', 'total_return']);
  const startBal = getVal(modelSummary, ['StartBalance', 'start_balance']);
  
  if (startBal && endBal) {
     totalRet = ((endBal - startBal) / startBal) * 100;
  }

  return [
    {
      id: 'cagr',
      label: 'Annualized Return (CAGR)',
      modelValue: formatPercent(cagr),
      benchValue: benchSummary ? formatPercent(getVal(benchSummary, ['CAGR', 'annualized_return_cagr', 'cagr'])) : 'N/A',
      rawModel: cagr,
      rawBench: benchSummary ? getVal(benchSummary, ['CAGR', 'annualized_return_cagr', 'cagr']) : null,
      higherIsBetter: true,
      tooltip: 'The compound annual growth rate measuring the mean annual growth of an investment over a specified period of time longer than one year.'
    },
    {
      id: 'maxDrawdown',
      label: 'Max Drawdown',
      modelValue: formatPercent(maxDD),
      benchValue: benchSummary ? formatPercent(getVal(benchSummary, ['MaxDrawdown', 'max_drawdown', 'drawdown'])) : 'N/A',
      rawModel: maxDD,
      rawBench: benchSummary ? getVal(benchSummary, ['MaxDrawdown', 'max_drawdown', 'drawdown']) : null,
      higherIsBetter: true, 
      isNegativeGood: false, 
      tooltip: 'The maximum observed loss from a peak to a trough of a portfolio, before a new peak is attained.'
    },
    {
      id: 'sharpe',
      label: 'Sharpe Ratio',
      modelValue: formatNumber(sharpe),
      benchValue: benchSummary ? formatNumber(getVal(benchSummary, ['SharpeRatio', 'sharpe_ratio', 'sharpe', 'Sharpe Ratio', 'Sharpe'])) : 'N/A',
      rawModel: sharpe,
      rawBench: benchSummary ? getVal(benchSummary, ['SharpeRatio', 'sharpe_ratio', 'sharpe', 'Sharpe Ratio', 'Sharpe']) : null,
      higherIsBetter: true,
      tooltip: 'The average return earned in excess of the risk-free rate per unit of volatility.'
    },
    {
      id: 'bestYear',
      label: 'Best Year',
      modelValue: formatPercent(bestY),
      benchValue: benchSummary ? formatPercent(getVal(benchSummary, ['BestYear', 'best_year'])) : 'N/A',
      rawModel: bestY,
      rawBench: benchSummary ? getVal(benchSummary, ['BestYear', 'best_year']) : null,
      higherIsBetter: true,
      tooltip: 'The highest annual return achieved by the strategy in a single calendar year.'
    },
    {
      id: 'worstYear',
      label: 'Worst Year',
      modelValue: formatPercent(worstY),
      benchValue: benchSummary ? formatPercent(getVal(benchSummary, ['WorstYear', 'worst_year'])) : 'N/A',
      rawModel: worstY,
      rawBench: benchSummary ? getVal(benchSummary, ['WorstYear', 'worst_year']) : null,
      higherIsBetter: true,
      tooltip: 'The lowest annual return sustained by the strategy in a single calendar year.'
    },
    {
      id: 'totalReturn',
      label: 'Total Return',
      modelValue: formatPercent(totalRet),
      benchValue: benchSummary ? formatPercent(getVal(benchSummary, ['TotalReturn', 'total_return'])) : 'N/A',
      rawModel: totalRet,
      rawBench: benchSummary ? getVal(benchSummary, ['TotalReturn', 'total_return']) : null,
      higherIsBetter: true,
      tooltip: 'The total percentage return of the investment over the entire period.'
    }
  ];
};

export const transformStrategyDataWithDailyReturns = (trades, dailyDataMap, initialBalance = 100000) => {
  if (!trades || !dailyDataMap) return [];

  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sortedTrades.length === 0) return [];

  let currentDate = new Date(sortedTrades[0].date);
  const today = new Date();
  
  let currentBalance = initialBalance;
  let currentSymbol = null;
  
  const equityCurve = [];
  const getDayStr = (d) => d.toISOString().split('T')[0];
  
  while (currentDate <= today) {
    const dateStr = getDayStr(currentDate);
    
    // Trade Logic
    const tradesToday = sortedTrades.filter(t => t.date === dateStr);
    if (tradesToday.length > 0) {
        const buyTrade = tradesToday.find(t => t.action === 'BUY');
        const sellTrade = tradesToday.find(t => t.action === 'SELL');
        
        if (sellTrade) currentSymbol = null;
        if (buyTrade) currentSymbol = buyTrade.symbol;
    }

    // Performance Logic
    if (currentSymbol && dailyDataMap[currentSymbol]) {
      const stockData = dailyDataMap[currentSymbol].find(d => d.date === dateStr);
      if (stockData && stockData.dailyReturn != null) {
        currentBalance = currentBalance * (1 + stockData.dailyReturn);
      }
    }

    if (!isNaN(currentBalance)) {
      equityCurve.push({
        date: dateStr,
        value: currentBalance,
        symbol: currentSymbol || 'CASH'
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return equityCurve;
};

/**
 * Calculates performance metrics from a daily equity curve.
 */
export const calculateMetricsFromEquityCurve = async (equityCurve, initialBalance, providedSharpe = null) => {
  if (!equityCurve || !Array.isArray(equityCurve) || equityCurve.length < 2) return null;

  const validPoints = equityCurve
    .map(d => ({
      date: d.date,
      value: d.value !== undefined ? d.value : (d.equity !== undefined ? d.equity : null)
    }))
    .filter(d => d.value !== null && !isNaN(d.value) && isFinite(d.value));

  if (validPoints.length < 2) return null;

  const values = validPoints.map(d => d.value);
  const startVal = values[0]; 
  const endVal = values[values.length - 1];
  const startDate = validPoints[0].date;
  const endDate = validPoints[validPoints.length - 1].date;

  // 3. Calculate Other Metrics
  const totalReturn = startVal > 0 ? ((endVal - startVal) / startVal) * 100 : 0;
  
  // Calculate CAGR manually (Calendar based)
  const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
  const years = Math.max(days / 365.25, 0.001);
  const cagr = (startVal > 0 && endVal > 0) ? (Math.pow(endVal / startVal, 1 / years) - 1) * 100 : 0;

  // Calculate Sharpe if not provided
  let sharpe = providedSharpe;
  
  if (sharpe === null) {
      // Calculate Sharpe: (CAGR - RiskFree) / Annualized Volatility
      const returns = [];
      for (let i = 1; i < values.length; i++) {
         if (values[i-1] > 0) returns.push((values[i] - values[i-1]) / values[i-1]);
      }
      
      if (returns.length > 1) {
          const mean = returns.reduce((a,b) => a+b, 0) / returns.length;
          const variance = returns.reduce((a,b) => a + Math.pow(b-mean, 2), 0) / (returns.length - 1);
          const stdDev = Math.sqrt(variance);
          const annualizedVol = stdDev * Math.sqrt(252);
          
          const riskFreeRate = 0.04;
          // Use CAGR (decimal)
          const cagrDecimal = cagr / 100; 
          
          if (annualizedVol > 0) {
              sharpe = (cagrDecimal - riskFreeRate) / annualizedVol;
          } else {
              sharpe = 0;
          }
      } else {
          sharpe = 0;
      }
  }

  // Calculate Max Drawdown
  let maxDD = 0;
  let peak = startVal;
  for (const val of values) {
    if (val > peak) peak = val;
    if (peak > 0) {
        const dd = (peak - val) / peak;
        if (dd > maxDD) maxDD = dd;
    }
  }

  // Calculate Best/Worst Year
  const byYear = {};
  validPoints.forEach(d => {
    if (!d.date) return;
    const year = d.date.split('-')[0];
    if (!byYear[year]) byYear[year] = { start: d.value, end: d.value, firstEntry: true };
    if (byYear[year].firstEntry) {
         byYear[year].start = d.value;
         byYear[year].firstEntry = false;
    }
    byYear[year].end = d.value;
  });

  const annualReturns = Object.keys(byYear).map(year => {
      const { start, end } = byYear[year];
      return start > 0 ? ((end - start) / start) * 100 : 0;
  });

  const bestYear = annualReturns.length > 0 ? Math.max(...annualReturns) : 0;
  const worstYear = annualReturns.length > 0 ? Math.min(...annualReturns) : 0;

  return {
    CAGR: cagr,
    MaxDrawdown: maxDD * 100, 
    SharpeRatio: sharpe,
    BestYear: bestYear,
    WorstYear: worstYear,
    EndBalance: endVal,
    StartBalance: startVal,
    TotalReturn: totalReturn,
    // Aliases
    annualized_return_cagr: cagr,
    max_drawdown: maxDD * 100,
    sharpe_ratio: sharpe,
    best_year: bestYear,
    worst_year: worstYear,
    end_balance: endVal,
    start_balance: startVal,
    total_return: totalReturn
  };
};

export const verifyTradeSequence = (trades, initialBalance = 100000, finalBalanceToCheck) => {
    if (!trades || !Array.isArray(trades)) {
        return { verifiedBalance: 0, totalReturn: 0, positions: [], log: [{ type: 'ERROR', message: 'Invalid trades array' }], match: false };
    }

    let currentBalance = initialBalance;
    const log = [];
    const positions = [];
    
    const sorted = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
    let activePosition = null;

    for (const trade of sorted) {
        if (trade.action === 'BUY') {
            if (activePosition) {
                log.push({ type: 'WARNING', message: `Overlapping position detected. Bought ${trade.symbol} while holding ${activePosition.symbol}` });
            }
            activePosition = { symbol: trade.symbol, entryDate: trade.date, entryPrice: trade.price, shares: trade.shares };
        } else if (trade.action === 'SELL') {
            if (!activePosition || activePosition.symbol !== trade.symbol) {
                log.push({ type: 'ERROR', message: `Sell signal for ${trade.symbol} without matching active position.` });
                continue;
            }
            
            const grossReturn = (trade.price - activePosition.entryPrice) / activePosition.entryPrice;
            const pnl = currentBalance * grossReturn;
            
            positions.push({
                symbol: trade.symbol,
                entry: activePosition.entryDate,
                exit: trade.date,
                entryPrice: activePosition.entryPrice,
                exitPrice: trade.price,
                returnPct: grossReturn * 100,
                pnl: pnl
            });
            
            currentBalance += pnl;
            activePosition = null;
        }
    }
    
    if (activePosition && finalBalanceToCheck) {
        const impliedFinalValue = finalBalanceToCheck;
        const totalPnL = impliedFinalValue - currentBalance;
        const impliedReturn = totalPnL / currentBalance;
        
        positions.push({
            symbol: activePosition.symbol,
            entry: activePosition.entryDate,
            exit: 'OPEN (Implied)',
            entryPrice: activePosition.entryPrice,
            exitPrice: activePosition.entryPrice * (1 + impliedReturn),
            returnPct: impliedReturn * 100,
            pnl: totalPnL,
            isImplied: true
        });
        currentBalance = impliedFinalValue;
    }

    const totalReturnCalc = ((currentBalance - initialBalance) / initialBalance) * 100;
    
    return {
        verifiedBalance: currentBalance,
        totalReturn: totalReturnCalc,
        positions,
        log,
        match: finalBalanceToCheck ? Math.abs(currentBalance - finalBalanceToCheck) < 1 : true
    };
};

export const validateStrategyDataIntegrity = (strategyData, strategyKey) => {
    // Defensive check for null/undefined strategyData
    if (!strategyData) {
        return { 
            valid: false, 
            errors: ["No data provided"], 
            warnings: [],
            meta: { dataPoints: 0, tradeCount: 0 }
        };
    }

    const errors = [];
    const warnings = [];
    const summary = strategyData.performanceSummary?.[strategyKey] || strategyData.performanceSummary;

    if (!summary) {
        warnings.push(`Missing pre-calculated performanceSummary`);
    } else {
        if (summary.CAGR === undefined && summary.annualized_return_cagr === undefined) {
             warnings.push("Missing explicit CAGR metric");
        }
    }

    if (strategyData.portfolioGrowth && Array.isArray(strategyData.portfolioGrowth)) {
        if (strategyData.portfolioGrowth.length === 0) {
           warnings.push("Portfolio growth data is empty"); 
        } else {
           const first = strategyData.portfolioGrowth[0];
           if (!first.date) errors.push("Portfolio growth entries missing 'date' field");
        }
    } else {
        errors.push("Missing 'portfolioGrowth' array");
    }

    // Calculate meta stats safely
    const dataPoints = Array.isArray(strategyData.portfolioGrowth) ? strategyData.portfolioGrowth.length : 0;
    const tradeCount = Array.isArray(strategyData.trades) ? strategyData.trades.length : 0;

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        meta: {
            dataPoints,
            tradeCount
        }
    };
};

// Legacy support wrapper
export const recalculateStrategyMetrics = async (portfolioGrowthData, startBalance, providedSharpe = null) => {
    if (!portfolioGrowthData || !Array.isArray(portfolioGrowthData) || portfolioGrowthData.length < 2) {
        return null;
    }
    
    const normalizedData = portfolioGrowthData.map(d => {
        let val = d.value !== undefined ? d.value : d.equity;
        if (val === undefined) {
             const keys = Object.keys(d).filter(k => k !== 'date' && typeof d[k] === 'number');
             if (keys.length > 0) val = d[keys[0]];
        }
        return { date: d.date, value: val };
    });
    
    return calculateMetricsFromEquityCurve(normalizedData, startBalance, providedSharpe);
};

export const calculateSPYMetricsFromPortfolioGrowth = async (portfolioGrowth) => {
  if (!portfolioGrowth || !Array.isArray(portfolioGrowth) || portfolioGrowth.length < 2) return null;

  let benchKey = null;
  for (let i = 0; i < Math.min(portfolioGrowth.length, 10); i++) {
      const p = portfolioGrowth[i];
      if (!p) continue;
      if (p.Vanguard500Index !== undefined) { benchKey = 'Vanguard500Index'; break; }
      if (p.Vanguard500 !== undefined) { benchKey = 'Vanguard500'; break; }
      if (p.benchmark !== undefined) { benchKey = 'benchmark'; break; }
      if (p.spy !== undefined) { benchKey = 'spy'; break; }
      if (p.SPY !== undefined) { benchKey = 'SPY'; break; }
  }
  
  if (!benchKey) return null;

  const spyCurve = portfolioGrowth.map(p => ({
    date: p.date,
    value: p[benchKey]
  })).filter(p => p.date && p.value !== undefined && !isNaN(p.value));

  if (spyCurve.length < 2) return null;
  spyCurve.sort((a, b) => new Date(a.date) - new Date(b.date));

  return calculateMetricsFromEquityCurve(spyCurve, spyCurve[0].value);
};