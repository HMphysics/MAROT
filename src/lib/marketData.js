import { supabase } from '@/lib/customSupabaseClient';

/**
 * Fetches historical risk-free rates (10-year Treasury Yield) via Edge Function.
 * Converts annual yield to daily rates.
 * 
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {Promise<Array<{date: string, annualRate: number, dailyRate: number}>>}
 */
export const fetchRiskFreeRates = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-treasury-rates', {
      body: JSON.stringify({ startDate, endDate })
    });

    if (error) {
      console.warn('Error fetching risk-free rates:', error);
      return [];
    }

    return data?.rates || [];
  } catch (err) {
    console.error('Unexpected error fetching risk-free rates:', err);
    return [];
  }
};