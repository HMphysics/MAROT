import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useSPYData = (strategyKey = null) => {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSPY = useCallback(async (forcedKey = null) => {
    const timestamp = new Date().toISOString();
    const targetKey = forcedKey || (strategyKey ? `SPY_${strategyKey}` : 'SPY');
    
    try {
      setLoading(true);
      setError(null);

      const { data: responseData, error: responseError } = await supabase
        .from('spy_metrics')
        .select('*')
        .eq('strategy_name', targetKey)
        .limit(1)
        .maybeSingle();

      if (responseError) {
          throw responseError;
      }

      if (responseData) {
          const histData = responseData.spy_historical_data || [];
          setData(histData);
          setMetrics(responseData.spy_metrics || {});
          return { data: histData, metrics: responseData.spy_metrics, updatedAt: responseData.updated_at };
      } else {
          if (targetKey !== 'SPY') {
               return fetchSPY('SPY');
          }
          setData([]);
          setMetrics(null);
          return null;
      }

    } catch (err) {
      setError(err.message || `Failed to load benchmark data for ${targetKey}.`);
      setData([]);
      setMetrics(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [strategyKey]);

  useEffect(() => {
    fetchSPY();
  }, [fetchSPY]);

  return { data, metrics, loading, error, refetch: fetchSPY };
};

export const useStrategyData = (tableName, strategyKey = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchStrategy = useCallback(async () => {
    if (!tableName) return;
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.group(`🚨 DEEP DIAGNOSTIC ANALYSIS - STRATEGY: ${strategyKey || 'UNKNOWN'} 🚨`);
      console.info(`[1] CONFIGURATION:`);
      console.info(`    - Table Name: ${tableName}`);
      console.info(`    - Strategy Key: ${strategyKey}`);
      console.info(`    - Timestamp: ${timestamp}`);
      
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from(tableName)
        .select('data, file_name')
        .order('created_at', { ascending: false })
        .limit(1);

      // Only apply ilike filter for shared table 'strategy_data'
      // Dedicated tables (strategy_data_1, 2, 3, 4) should just take the first record
      if (strategyKey && tableName === 'strategy_data') {
         query = query.ilike('file_name', `%${strategyKey}%`);
         console.info(`[2] QUERY: Applying ilike filter -> file_name ILIKE '%${strategyKey}%' on table '${tableName}'`);
      } else {
         console.info(`[2] QUERY: Fetching latest record from table '${tableName}' (No ILIKE filter applied)`);
      }

      const { data: result, error: err } = await query.maybeSingle();
      const fetchTime = (performance.now() - startTime).toFixed(2);
      
      console.info(`[3] SUPABASE RESPONSE (${fetchTime}ms):`);
      if (err) {
          console.error(`    - ❌ ERROR FETCHING DATA:`, err);
          throw err;
      }
      
      if (!result) {
          console.warn(`    - ⚠️ NO RECORD FOUND in table '${tableName}' for strategy '${strategyKey}'`);
          throw new Error(`No data found for ${strategyKey || 'this strategy'}. Please upload data using Strategy Manager.`);
      }

      console.info(`    - ✅ RECORD FOUND: file_name = '${result.file_name}'`);
      
      if (!result.data) {
          console.warn(`    - ⚠️ 'data' COLUMN IS EMPTY OR NULL`);
          throw new Error(`Data column is empty for ${strategyKey || 'this strategy'}.`);
      }

      const rawData = result.data || {};
      
      console.info(`[4] RAW JSON STRUCTURE ANALYSIS:`);
      console.info(`    - Is Array? ${Array.isArray(rawData)}`);
      console.info(`    - Type: ${typeof rawData}`);
      
      if (!Array.isArray(rawData)) {
          const keys = Object.keys(rawData);
          console.info(`    - Top-level keys (${keys.length}):`, keys);
          
          keys.forEach(key => {
              const val = rawData[key];
              const isArr = Array.isArray(val);
              const type = typeof val;
              const preview = isArr ? `Array(${val.length})` : (type === 'object' && val !== null ? `Object(${Object.keys(val).length} keys)` : String(val).substring(0, 50));
              console.info(`      -> "${key}": ${type} ${isArr ? '[ARRAY]' : ''} = ${preview}`);
          });
      } else {
          console.info(`    - Array Length: ${rawData.length}`);
      }

      // Handle various JSON structures flexibly
      let portfolioGrowth = [];
      let extractionMethod = "UNKNOWN";
      
      console.info(`[5] EQUITY CURVE ARRAY EXTRACTION:`);
      
      if (Array.isArray(rawData)) {
          portfolioGrowth = rawData;
          extractionMethod = "Raw Array";
      } else if (rawData.portfolioGrowth && Array.isArray(rawData.portfolioGrowth)) {
          portfolioGrowth = rawData.portfolioGrowth;
          extractionMethod = "rawData.portfolioGrowth";
      } else if (rawData.data && Array.isArray(rawData.data)) {
          portfolioGrowth = rawData.data;
          extractionMethod = "rawData.data";
      } else {
          const potentialArrays = Object.entries(rawData).filter(([k, v]) => Array.isArray(v));
          if (potentialArrays.length > 0) {
              portfolioGrowth = potentialArrays[0][1];
              extractionMethod = `Guessed from key '${potentialArrays[0][0]}'`;
          } else {
              console.error(`    - ❌ FAILED TO FIND ANY ARRAY IN JSON STRUCTURE`);
          }
      }
      
      console.info(`    - Extraction Method Used: ${extractionMethod}`);
      console.info(`    - Extracted Array Length: ${portfolioGrowth.length}`);
      
      if (portfolioGrowth.length > 0) {
          console.info(`    - First Item Structure (Keys):`, Object.keys(portfolioGrowth[0]));
          console.info(`    - First Item Sample:`, JSON.stringify(portfolioGrowth[0]).substring(0, 150));
      }

      let mappingFailures = 0;
      let missingValueCount = 0;
      let missingDateCount = 0;

      console.info(`[6] FIELD MAPPING ANALYSIS:`);
      const mappedData = portfolioGrowth.map((item, index) => {
          let value = item.value !== undefined ? item.value : (item.equity !== undefined ? item.equity : item[strategyKey]);
          
          let possibleKeyUsed = null;
          if (value === undefined) {
              const possibleKey = Object.keys(item).find(k => 
                  k.toLowerCase() !== 'date' && 
                  k.toLowerCase() !== 'time' && 
                  typeof item[k] === 'number'
              );
              if (possibleKey) {
                  value = item[possibleKey];
                  possibleKeyUsed = possibleKey;
              }
          }

          const date = item.date || item.Date || item.time || item.Time;
          
          if (index === 0) {
             console.info(`    - Mapping Item 0:`);
             console.info(`      -> Target Date Fields: 'date', 'Date', 'time', 'Time'`);
             console.info(`      -> Target Value Fields: 'value', 'equity', '${strategyKey}', numeric fallback`);
             console.info(`      -> Extracted Date: ${date} (from ${Object.keys(item).find(k => item[k] === date) || 'unknown'})`);
             console.info(`      -> Extracted Value: ${value} (from ${item.value !== undefined ? 'value' : (item.equity !== undefined ? 'equity' : (item[strategyKey] !== undefined ? strategyKey : possibleKeyUsed || 'unknown'))})`);
          }

          if (date === undefined) missingDateCount++;
          if (value === undefined || isNaN(Number(value)) || value === null) missingValueCount++;

          return {
              date: date,
              value: Number(value)
          };
      });

      console.info(`    - Items mapped: ${mappedData.length}`);
      console.info(`    - Items missing date: ${missingDateCount}`);
      console.info(`    - Items missing/invalid value: ${missingValueCount}`);

      const equityCurve = mappedData
      .filter(item => item.date && !isNaN(item.value) && item.value !== null)
      .sort((a,b) => new Date(a.date) - new Date(b.date));

      const processTime = (performance.now() - startTime).toFixed(2);
      
      console.info(`[7] FINAL FILTERING & VALIDATION (${processTime}ms total elapsed):`);
      console.info(`    - Valid data points remaining: ${equityCurve.length}`);

      if (equityCurve.length === 0) {
           console.error(`    - ❌ PARSING FAILED: Filter removed all items or array was empty.`);
           if (mappedData.length > 0) {
               console.error(`    - 🔍 Let's examine the first mapped item that failed validation:`, mappedData[0]);
               console.error(`    - Is date truthy? ${!!mappedData[0].date}`);
               console.error(`    - Is value a valid number? ${!isNaN(mappedData[0].value) && mappedData[0].value !== null} (Raw value: ${mappedData[0].value})`);
           }
           const errorMsg = "Data was found, but could not parse equity curve. Please check JSON structure. Check console logs for Deep Diagnostic Analysis.";
           console.error(`    - Throwing Error:`, errorMsg);
           console.groupEnd();
           throw new Error(errorMsg);
      }

      console.info(`    - ✅ PARSING SUCCESSFUL!`);
      console.groupEnd();

      setData({
          rawData,
          equityCurve
      });
      
    } catch (e) {
      console.error(`🚨 DEEP DIAGNOSTIC EXCEPTION CAUGHT:`, e);
      console.groupEnd();
      setError(e.message || `Failed to load strategy data from ${tableName}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tableName, strategyKey]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  return { data, loading, error, refetch: fetchStrategy };
};