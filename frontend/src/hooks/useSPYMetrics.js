import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateMonthlySharpe } from '@/lib/metricsCalculator';

export const useSPYMetrics = (strategyKey) => {
  const [spyMetrics, setSpyMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateMetrics = (data) => {
    if (!data || data.length < 2) return null;
    const sorted = [...data].sort((a, b) => new Date(a.date || a.Date) - new Date(b.date || b.Date));
    const values = sorted.map(d => {
        if (d.value !== undefined) return Number(d.value);
        if (d.close !== undefined) return Number(d.close);
        if (d.Close !== undefined) return Number(d.Close);
        return 0;
    });

    const startPrice = values[0];
    const endPrice = values[values.length - 1];
    
    const dailyReturns = [];
    for (let i = 1; i < values.length; i++) {
        const prev = values[i-1];
        const curr = values[i];
        if (prev > 0) {
            dailyReturns.push((curr - prev) / prev);
        }
    }

    const n = dailyReturns.length;
    let volatility = 0;
    if (n > 1) {
        const meanDailyReturn = dailyReturns.reduce((acc, val) => acc + val, 0) / n;
        const variance = dailyReturns.reduce((acc, val) => acc + Math.pow(val - meanDailyReturn, 2), 0) / (n - 1);
        volatility = Math.sqrt(variance) * Math.sqrt(252);
    }

    const tradingDays = values.length;
    const yearsApprox = tradingDays > 0 ? tradingDays / 252 : 0;
    const annualReturnExponent = yearsApprox > 0 ? 1 / yearsApprox : 0;
    const cagr = startPrice > 0 ? Math.pow(endPrice / startPrice, annualReturnExponent) - 1 : 0;
    const sharpeRatio = calculateMonthlySharpe(sorted);

    let maxDrawdown = 0;
    let peak = values[0];
    for (const val of values) {
        if (val > peak) peak = val;
        if (peak > 0) {
            const dd = (val - peak) / peak; 
            if (dd < maxDrawdown) maxDrawdown = dd;
        }
    }

    const totalReturn = startPrice > 0 ? (endPrice - startPrice) / startPrice : 0;
    const yearMap = new Map();
    sorted.forEach(item => {
        const dateStr = item.date || item.Date;
        if (!dateStr) return;
        const y = new Date(dateStr).getFullYear().toString();
        if (!yearMap.has(y)) yearMap.set(y, []);
        const val = item.value !== undefined ? Number(item.value) : (item.close !== undefined ? Number(item.close) : 0);
        yearMap.get(y).push(val);
    });

    const yearReturns = [];
    yearMap.forEach((vals, year) => {
        if (vals.length >= 200) {
            const start = vals[0];
            const end = vals[vals.length - 1];
            if (start > 0) {
                const ret = (end - start) / start;
                yearReturns.push(ret);
            }
        }
    });

    const bestYear = yearReturns.length > 0 ? Math.max(...yearReturns) : 0;
    const worstYear = yearReturns.length > 0 ? Math.min(...yearReturns) : 0;

    return { totalReturn, volatility, sharpeRatio, maxDrawdown, cagr, bestYear, worstYear };
  };

  const fetchMetrics = useCallback(async () => {
    const timestamp = new Date().toISOString();
    try {
      setLoading(true);
      setError(null);
      
      const targetKey = strategyKey ? `SPY_${strategyKey}` : 'SPY';
      console.log(`[${timestamp}] [useSPYMetrics] Fetching metrics for key: ${targetKey}`);

      let { data: response, error: err } = await supabase
        .from('spy_metrics')
        .select('*')
        .eq('strategy_name', targetKey)
        .limit(1)
        .maybeSingle();

      if (!response && targetKey !== 'SPY') {
         console.warn(`[${timestamp}] [useSPYMetrics] Data missing for ${targetKey}, falling back to 'SPY'`);
         const { data: fallback, error: fallbackErr } = await supabase
            .from('spy_metrics')
            .select('*')
            .eq('strategy_name', 'SPY')
            .limit(1)
            .maybeSingle();
         response = fallback;
         err = fallbackErr;
      }

      if (err) {
          console.error(`[${timestamp}] [useSPYMetrics] Supabase error:`, err);
          throw err;
      }

      if (response && response.spy_historical_data && Array.isArray(response.spy_historical_data)) {
          const metrics = calculateMetrics(response.spy_historical_data);
          console.log(`[${timestamp}] [useSPYMetrics] Successfully calculated metrics for ${targetKey}`);
          setSpyMetrics(metrics);
      } else {
          console.warn(`[${timestamp}] [useSPYMetrics] No historical data found to calculate metrics for ${targetKey}`);
          setSpyMetrics(null);
      }

    } catch (e) {
      console.error(`[${timestamp}] [useSPYMetrics] Exception caught:`, e);
      setError(e.message || "Failed to fetch SPY metrics");
      setSpyMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [strategyKey]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { spyMetrics, loading, error };
};