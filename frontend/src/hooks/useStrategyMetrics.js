import { useMemo } from 'react';
import {
  calculateTotalReturn,
  calculateCAGR,
  calculateMaxDrawdown,
  calculateBestWorstYear,
  calculateMonthlySharpe
} from '@/lib/metricsCalculator';

export const useStrategyMetrics = (strategyData) => {
  const metrics = useMemo(() => {
    const timestamp = new Date().toISOString();
    
    // 1. Handle edge cases: No data
    if (!strategyData || !strategyData.equityCurve || !Array.isArray(strategyData.equityCurve) || strategyData.equityCurve.length < 2) {
      console.warn(`[${timestamp}] [useStrategyMetrics] Invalid or missing strategy data. Cannot calculate metrics.`);
      return null;
    }

    try {
      const equityCurve = strategyData.equityCurve;
      console.log(`[${timestamp}] [useStrategyMetrics] Processing metrics for equity curve with ${equityCurve.length} points.`);
      
      // Sort to ensure correct order
      const sortedCurve = [...equityCurve].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Basic extraction
      const initialEquity = sortedCurve[0].value !== undefined ? sortedCurve[0].value : sortedCurve[0].equity;
      const finalEquity = sortedCurve[sortedCurve.length - 1].value !== undefined ? sortedCurve[sortedCurve.length - 1].value : sortedCurve[sortedCurve.length - 1].equity;

      if (initialEquity === undefined || finalEquity === undefined || initialEquity === 0) {
        console.error(`[${timestamp}] [useStrategyMetrics] Invalid equity values found. Initial: ${initialEquity}, Final: ${finalEquity}`);
        return null;
      }

      // Time calculations
      const startDate = new Date(sortedCurve[0].date);
      const endDate = new Date(sortedCurve[sortedCurve.length - 1].date);
      const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
      const years = (endDate - startDate) / msPerYear;

      // 2. Metrics Calculation
      const totalReturn = calculateTotalReturn(initialEquity, finalEquity);
      const cagr = calculateCAGR(initialEquity, finalEquity, years);
      const maxDrawdown = calculateMaxDrawdown(sortedCurve);
      const sharpeRatio = calculateMonthlySharpe(sortedCurve);
      const { bestYear, worstYear } = calculateBestWorstYear(sortedCurve);

      console.log(`[${timestamp}] [useStrategyMetrics] Metrics calculated successfully.`);

      return {
        totalReturn,
        cagr,
        maxDrawdown,
        sharpeRatio,
        bestYear,
        worstYear
      };
    } catch (err) {
      console.error(`[${timestamp}] [useStrategyMetrics] Error calculating metrics:`, err);
      return null;
    }
  }, [strategyData]);

  return metrics;
};