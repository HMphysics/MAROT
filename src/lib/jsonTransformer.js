/**
 * Utility to validate and transform strategy JSON data locally.
 * Robust handling for various input formats and loose validation requirements.
 * Automatically calculates missing metrics from portfolio growth data.
 * Ensures backward compatibility with PascalCase keys used by frontend components.
 */

// Helper to normalize keys (remove special chars, lowercase)
const normalizeKey = (key) => key ? key.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

// Dictionary for mapping diverse input keys to standard output keys
const keyMappings = {
  // Performance Summary mappings
  'startbalance': 'start_balance',
  'startingbalance': 'start_balance',
  'endbalance': 'end_balance',
  'endingbalance': 'end_balance',
  'cagr': 'annualized_return_cagr',
  'annualizedreturn': 'annualized_return_cagr',
  'compoundannualgrowthrate': 'annualized_return_cagr',
  'stddev': 'standard_deviation',
  'standarddeviation': 'standard_deviation',
  'maxdrawdown': 'max_drawdown',
  'drawdown': 'max_drawdown',
  'sharperatio': 'sharpe_ratio',
  'sharpe': 'sharpe_ratio',
  'sortinoratio': 'sortino_ratio',
  'bestyear': 'best_year',
  'worstyear': 'worst_year',
  'totalreturn': 'total_return',
  'winrate': 'win_rate',
  
  // Root mappings - Variations
  'summarymetrics': 'performanceSummary',
  'performancesummary': 'performanceSummary',
  'metrics': 'performanceSummary',
  'stats': 'performanceSummary',
  
  'portfoliogrowth': 'portfolioGrowth',
  'equitycurve': 'portfolioGrowth',
  'growth': 'portfolioGrowth',
  'chartdata': 'portfolioGrowth',
  'portfolio': 'portfolioGrowth',
  
  'strategyname': 'strategy_name',
  'strategy': 'strategy_name',
  'name': 'strategy_name',
  
  'benchmarkname': 'benchmark_name',
  'benchmark': 'benchmark_name'
};

function mapObjectKeys(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const newObj = {};
  
  Object.keys(obj).forEach(key => {
    const normalized = normalizeKey(key);
    const targetKey = keyMappings[normalized] || key;
    newObj[targetKey] = obj[key];
  });
  return newObj;
}

// --- CALCULATION HELPERS ---

function calculateCAGR(startBalance, endBalance, years) {
  if (!startBalance || !endBalance || !years || years <= 0 || startBalance <= 0) return 0;
  return (Math.pow(endBalance / startBalance, 1 / years) - 1) * 100;
}

function calculateMaxDrawdown(portfolioGrowth) {
  if (!portfolioGrowth || portfolioGrowth.length === 0) return 0;
  
  let maxDD = 0;
  let peak = -Infinity;

  for (const point of portfolioGrowth) {
    const val = point.equity;
    if (val > peak) peak = val;
    
    if (peak > 0) {
      const dd = (peak - val) / peak;
      if (dd > maxDD) maxDD = dd;
    }
  }
  
  return maxDD * 100; // Return as percentage
}

function calculateSharpeRatio(portfolioGrowth, riskFreeRatePercent = 2) {
  if (!portfolioGrowth || portfolioGrowth.length < 2) return 0;

  // Calculate returns
  const returns = [];
  for (let i = 1; i < portfolioGrowth.length; i++) {
    const prev = portfolioGrowth[i - 1].equity;
    const curr = portfolioGrowth[i].equity;
    if (prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }

  if (returns.length === 0) return 0;

  // Determine frequency (approximate) to annualize
  let periodsPerYear = 52; 
  const d1 = new Date(portfolioGrowth[0].date);
  const d2 = new Date(portfolioGrowth[portfolioGrowth.length - 1].date);
  const diffDays = (d2 - d1) / (1000 * 60 * 60 * 24);
  
  if (diffDays > 0) {
      const avgDaysPerPoint = diffDays / portfolioGrowth.length;
      if (avgDaysPerPoint < 2) periodsPerYear = 252; // Daily
      else if (avgDaysPerPoint > 25) periodsPerYear = 12; // Monthly
  }

  const rfPerPeriod = (riskFreeRatePercent / 100) / periodsPerYear;
  
  // Calculate Mean and StdDev
  const sumReturns = returns.reduce((a, b) => a + b, 0);
  const avgReturn = sumReturns / returns.length;
  
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / (returns.length - 1 || 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // Annualized Sharpe
  const sharpe = ((avgReturn - rfPerPeriod) / stdDev) * Math.sqrt(periodsPerYear);
  return sharpe;
}

function calculateBestWorstYear(portfolioGrowth) {
  if (!portfolioGrowth || portfolioGrowth.length === 0) {
    return { best_year: 0, worst_year: 0 };
  }

  // Robustly group by year
  const yearsMap = {};
  portfolioGrowth.forEach(pt => {
      if (!pt.date) return;
      const d = new Date(pt.date);
      if (isNaN(d.getTime())) return;
      
      const year = d.getFullYear();
      if (!yearsMap[year]) {
          yearsMap[year] = { firstDate: d, firstVal: pt.equity, lastDate: d, lastVal: pt.equity };
      } else {
          if (d < yearsMap[year].firstDate) {
              yearsMap[year].firstDate = d;
              yearsMap[year].firstVal = pt.equity;
          }
          if (d > yearsMap[year].lastDate) {
              yearsMap[year].lastDate = d;
              yearsMap[year].lastVal = pt.equity;
          }
      }
  });

  const yearlyReturns = Object.keys(yearsMap).map(y => {
      const { firstVal, lastVal } = yearsMap[y];
      if (firstVal === 0) return 0;
      return ((lastVal - firstVal) / firstVal) * 100;
  });

  if (yearlyReturns.length === 0) return { best_year: 0, worst_year: 0 };

  return {
      best_year: Math.max(...yearlyReturns),
      worst_year: Math.min(...yearlyReturns)
  };
}


export function transformStrategyJSON(input) {
  let strategyData = input;
  const errors = [];

  // 1. Parse JSON if input is string
  if (typeof input === 'string') {
    try {
      strategyData = JSON.parse(input);
    } catch (e) {
      return { 
        success: false, 
        errors: [`Invalid JSON syntax: ${e.message}`],
        data: null 
      };
    }
  }

  if (!strategyData || typeof strategyData !== 'object') {
     return { success: false, errors: ["Input must be a valid JSON object"], data: null };
  }

  try {
    // --- TRANSFORMATION LOGIC ---
    
    // 1. Normalize Root Keys
    let root = mapObjectKeys(strategyData);
    
    // 2. Identify Strategy & Benchmark Names
    let strategyName = root.strategy_name || "Unknown Strategy";
    let benchmarkName = root.benchmark_name || "SPY";
    
    // 3. Locate Data Objects
    let perfSummary = root.performanceSummary || {};
    let portfolio = root.portfolioGrowth || [];

    // Intelligent Search: If main keys missing, search in values
    if (!root.performanceSummary && !root.portfolioGrowth) {
        Object.values(root).forEach(val => {
            if (val && typeof val === 'object') {
                 if (Array.isArray(val)) {
                     // Likely portfolio growth if it has items
                     if (val.length > 0 && (val[0].date || val[0].equity || val[0].value)) {
                         portfolio = val;
                     }
                 } else {
                     // Likely metrics if it has numeric fields
                     const k = Object.keys(val).map(normalizeKey);
                     if (k.includes('cagr') || k.includes('sharperatio') || k.includes('totalreturn')) {
                         perfSummary = val;
                     }
                 }
            }
        });
    }

    // Handle nested performanceSummary scenario
    const summaryKeys = Object.keys(perfSummary);
    if (summaryKeys.length > 0) {
        const normalizedSummary = mapObjectKeys(perfSummary);
        if (!normalizedSummary.start_balance && !normalizedSummary.annualized_return_cagr) {
             const nestedKey = summaryKeys.find(k => typeof perfSummary[k] === 'object' && !Array.isArray(perfSummary[k]));
             if (nestedKey) {
                 perfSummary = perfSummary[nestedKey];
             }
        }
    }

    // 4. Normalize Performance Summary Keys
    // We start with a fresh object to avoid pollution
    let normalizedMetrics = mapObjectKeys(perfSummary);
    
    // Ensure numeric values for key metrics
    ['start_balance', 'end_balance', 'total_return', 'annualized_return_cagr', 'max_drawdown', 'sharpe_ratio', 'best_year', 'worst_year'].forEach(k => {
      if (normalizedMetrics[k] !== undefined) {
        let val = normalizedMetrics[k];
        if (typeof val === 'string') {
           val = val.replace(/[%$]/g, '');
        }
        normalizedMetrics[k] = parseFloat(val);
      }
    });

    // 5. Normalize Portfolio Growth (Pass 1: Structure)
    let tempPortfolio = [];
    
    if (Array.isArray(portfolio)) {
      tempPortfolio = portfolio.map((point) => {
        if (!point || typeof point !== 'object') return null;

        const p = mapObjectKeys(point);
        
        // Find equity
        let equity = p.equity;
        if (equity === undefined) {
           if (p[normalizeKey(strategyName)]) equity = p[normalizeKey(strategyName)];
           else if (p.value) equity = p.value;
           else if (p.balance) equity = p.balance;
           else {
             const valKey = Object.keys(p).find(k => 
               k !== 'date' && 
               k !== normalizeKey(benchmarkName) && 
               k !== 'cash' &&
               typeof p[k] === 'number'
             );
             if (valKey) equity = p[valKey];
           }
        }
        
        if (typeof equity === 'string') equity = parseFloat(equity.replace(/[^0-9.-]/g, ''));
        equity = Number(equity);
        if (isNaN(equity)) equity = 0;

        return {
          date: p.date, 
          equity: equity,
          cash: Number(p.cash || 0),
          // We'll calculate returns in Pass 2
          weekly_return: Number(p.weekly_return || 0), 
          cumulative_return: Number(p.cumulative_return || 0),
          drawdown_pct: Number(p.drawdown_pct || 0),
          exposure_pct: Number(p.exposure_pct || 100),
          // Preserve benchmark if found
          Vanguard500Index: p.vanguard500index || p.vanguard500 || p.benchmark || 0
        };
      }).filter(item => item !== null && item.date); // Filter invalid items
    }

    // Pass 2: Calculate missing series data (returns)
    const normalizedPortfolio = tempPortfolio.map((point, index) => {
        const prevEquity = index > 0 ? tempPortfolio[index - 1].equity : point.equity;
        
        let weekly_return = point.weekly_return;
        if (weekly_return === 0 && index > 0 && prevEquity !== 0) {
            weekly_return = (point.equity - prevEquity) / prevEquity;
        }

        return {
            ...point,
            weekly_return
        };
    });


    // --- AUTO-CALCULATE MISSING METRICS ---
    
    if (normalizedPortfolio.length >= 2) {
        const startBal = normalizedPortfolio[0].equity;
        const endBal = normalizedPortfolio[normalizedPortfolio.length - 1].equity;
        
        // Auto-fill Balance
        if (!normalizedMetrics.start_balance) normalizedMetrics.start_balance = startBal;
        if (!normalizedMetrics.end_balance) normalizedMetrics.end_balance = endBal;

        // Auto-fill Total Return
        if (normalizedMetrics.total_return === undefined && startBal > 0) {
            normalizedMetrics.total_return = ((endBal - startBal) / startBal) * 100;
        }

        // Calculate Date Range for CAGR
        const dStart = new Date(normalizedPortfolio[0].date);
        const dEnd = new Date(normalizedPortfolio[normalizedPortfolio.length - 1].date);
        const years = Math.max((dEnd - dStart) / (1000 * 60 * 60 * 24 * 365.25), 0.1);

        // Auto-fill CAGR
        if (normalizedMetrics.annualized_return_cagr === undefined) {
            normalizedMetrics.annualized_return_cagr = calculateCAGR(startBal, endBal, years);
        }

        // Auto-fill Max Drawdown
        if (normalizedMetrics.max_drawdown === undefined) {
            normalizedMetrics.max_drawdown = calculateMaxDrawdown(normalizedPortfolio);
        }

        // Auto-fill Sharpe Ratio
        if (normalizedMetrics.sharpe_ratio === undefined) {
            normalizedMetrics.sharpe_ratio = calculateSharpeRatio(normalizedPortfolio);
        }

        // Auto-fill Best/Worst Year
        if (normalizedMetrics.best_year === undefined || normalizedMetrics.worst_year === undefined) {
            const { best_year, worst_year } = calculateBestWorstYear(normalizedPortfolio);
            if (normalizedMetrics.best_year === undefined) normalizedMetrics.best_year = best_year;
            if (normalizedMetrics.worst_year === undefined) normalizedMetrics.worst_year = worst_year;
        }
    }

    // --- ALIASING FOR BACKWARD COMPATIBILITY ---
    // Ensure we have both Snake_Case (DB standard) and PascalCase (Frontend legacy)
    const aliases = [
        ['CAGR', 'annualized_return_cagr'],
        ['MaxDrawdown', 'max_drawdown'],
        ['SharpeRatio', 'sharpe_ratio'],
        ['BestYear', 'best_year'],
        ['WorstYear', 'worst_year'],
        ['StartBalance', 'start_balance'],
        ['EndBalance', 'end_balance'],
        ['TotalReturn', 'total_return']
    ];

    aliases.forEach(([pascal, snake]) => {
        // If we have snake but missing pascal -> copy to pascal
        if (normalizedMetrics[snake] !== undefined && normalizedMetrics[pascal] === undefined) {
            normalizedMetrics[pascal] = normalizedMetrics[snake];
        }
        // If we have pascal but missing snake -> copy to snake
        if (normalizedMetrics[pascal] !== undefined && normalizedMetrics[snake] === undefined) {
             normalizedMetrics[snake] = normalizedMetrics[pascal];
        }
    });

    const transformedData = {
      strategy_name: strategyName,
      benchmark_name: benchmarkName,
      performanceSummary: normalizedMetrics,
      portfolioGrowth: normalizedPortfolio
    };

    // --- RELAXED VALIDATION ---
    const hasMetrics = Object.keys(transformedData.performanceSummary).length > 0;
    const hasPortfolio = transformedData.portfolioGrowth.length > 0;

    if (!hasMetrics && !hasPortfolio) {
        errors.push("Could not identify any 'performanceSummary' or 'portfolioGrowth' data.");
    }
    
    if (hasPortfolio) {
        const validRows = transformedData.portfolioGrowth.filter(r => r.date && r.equity !== 0);
        if (validRows.length === 0) {
            errors.push("Portfolio data found but contained no valid rows with 'date' and 'equity'.");
        }
    }

    if (errors.length > 0) {
       return { success: false, errors, data: transformedData };
    }

    return { success: true, data: transformedData, errors: [] };

  } catch (error) {
    console.error("Transformation Error:", error);
    return { success: false, errors: [`Critical Error: ${error.message}`], data: null };
  }
}