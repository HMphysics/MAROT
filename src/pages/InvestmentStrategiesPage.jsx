import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import ReactECharts from 'echarts-for-react';
import { RefreshCw, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import Header from '@/components/Header';
import MetricsGrid from '@/components/MetricsGrid';
import { useSPYData, useStrategyData } from '@/hooks/useSPYData';
import { useSPYMetrics } from '@/hooks/useSPYMetrics';
import { useStrategies } from '@/hooks/useStrategies';
import { useStrategyMetrics } from '@/hooks/useStrategyMetrics';

// Base static configuration
const STRATEGY_CONFIG = [
  { id: 'model1', defaultLabel: 'Marot Model 1', table: 'strategy_data_1', key: 'DualMomentumModel' },
  { id: 'model2', defaultLabel: 'Marot Model 2', table: 'strategy_data_2', key: 'MarotMomentumModel2' },
  { id: 'model3', defaultLabel: 'Dual Momentum', table: 'strategy_data_3', key: 'Strategy3' },
  { id: 'model4', defaultLabel: 'Marot Momentum Model 2 (Alt)', table: 'strategy_data_4', key: 'MarotMomentumModel2_Alt' },
  { id: 'ugarit', defaultLabel: 'UGARIT', table: 'strategy_data', key: 'UGARIT' }
];

const InvestmentStrategiesPage = () => {
  const [selectedStrategyId, setSelectedStrategyId] = useState('ugarit');
  const { toast } = useToast();

  const { strategies: dynamicStrategies, loading: strategiesNamesLoading } = useStrategies();

  const availableStrategies = useMemo(() => {
    const merged = [...STRATEGY_CONFIG];
    if (dynamicStrategies && Array.isArray(dynamicStrategies)) {
      dynamicStrategies.forEach(ds => {
         if (!merged.find(m => m.key === ds.key)) {
            merged.push({
               id: ds.key.toLowerCase(),
               defaultLabel: ds.name,
               table: 'strategy_data',
               key: ds.key
            });
         }
      });
    }
    return merged.map(config => {
      const dynamic = dynamicStrategies.find(ds => ds.key === config.key);
      return {
        ...config,
        label: dynamic ? dynamic.name : config.defaultLabel
      };
    });
  }, [dynamicStrategies]);
  
  const selectedStrategy = useMemo(() => {
    const strat = availableStrategies.find(s => s.id === selectedStrategyId) || availableStrategies.find(s => s.id === 'ugarit') || availableStrategies[0];
    console.log(`\n\n=== 🧭 PAGE LAYER: Strategy Selection Changed ===`);
    console.log(`- Selected ID: ${selectedStrategyId}`);
    console.log(`- Resolved Strategy Key: ${strat.key}`);
    console.log(`- Target Table: ${strat.table}`);
    console.log(`=================================================\n`);
    return strat;
  }, [selectedStrategyId, availableStrategies]);

  const { 
    data: strategyData, 
    loading: strategyLoading, 
    error: strategyError,
    refetch: refetchStrategy 
  } = useStrategyData(selectedStrategy.table, selectedStrategy.key);

  const { 
    data: spyBenchmarkData, 
    loading: spyLoading,
    error: spyError,
    refetch: refetchSPY
  } = useSPYData(selectedStrategy.key);

  const {
    spyMetrics,
    loading: spyMetricsLoading,
    error: spyMetricsError
  } = useSPYMetrics(selectedStrategy.key);

  const calculatedMetrics = useStrategyMetrics(strategyData);

  // --- UI STATE LOGGING ---
  useEffect(() => {
      console.log(`\n=== 🖥️ PAGE LAYER: Render State Update ===`);
      console.log(`Strategy: ${selectedStrategy.key}`);
      console.log(`Loading Status:`, { strategyLoading, spyLoading, spyMetricsLoading });
      if (strategyError) console.error(`Error State active:`, strategyError);
      if (strategyData) console.log(`Data available for UI render. Equity Curve points: ${strategyData.equityCurve?.length || 0}`);
      console.log(`=========================================\n`);
  }, [strategyData, strategyLoading, strategyError, spyLoading, spyMetricsLoading, selectedStrategy.key]);


  const chartOption = useMemo(() => {
    if (!strategyData?.equityCurve || strategyData.equityCurve.length === 0) return null;

    const curve = strategyData.equityCurve;
    const dates = curve.map(d => d.date);
    const initialValue = curve[0].value;

    if (initialValue === undefined || isNaN(initialValue) || initialValue === 0) return null;

    const strategySeries = curve.map(d => (d.value / initialValue) * 100);

    let benchmarkSeries = [];
    if (spyBenchmarkData && spyBenchmarkData.length > 0) {
        const spyMap = new Map();
        spyBenchmarkData.forEach(item => {
             const d = item.date || item.Date;
             const v = item.close || item.value;
             if(d && v) spyMap.set(d, v);
        });

        let startSpyVal = 0;
        for(let i=0; i<dates.length; i++) {
            if (spyMap.has(dates[i])) {
                startSpyVal = spyMap.get(dates[i]);
                break;
            }
        }
        if (!startSpyVal) startSpyVal = spyMap.get(dates[0]) || spyBenchmarkData[0]?.close;

        if (startSpyVal) {
             let lastVal = startSpyVal;
             benchmarkSeries = dates.map(date => {
                 let val = spyMap.get(date);
                 if (val === undefined) val = lastVal;
                 else lastVal = val;
                 return (val / startSpyVal) * 100;
             });
        } else {
             benchmarkSeries = new Array(dates.length).fill(100);
        }
    }

    return {
      backgroundColor: 'transparent',
      grid: { top: 60, right: 20, bottom: 20, left: 50, containLabel: true },
      tooltip: { 
        trigger: 'axis', 
        backgroundColor: 'rgba(11, 12, 16, 0.95)',
        borderColor: '#333',
        textStyle: { color: '#e5e7eb', fontSize: 13 },
        formatter: (params) => {
           if (!params.length) return '';
           let res = `<div style="font-weight:600;color:#9ca3af;margin-bottom:8px">${params[0].axisValue}</div>`;
           params.forEach(p => {
              if (p.value == null) return;
              const pctReturn = p.value - 100;
              const sign = pctReturn > 0 ? '+' : '';
              res += `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px">
                <span style="color:${p.color}">${p.seriesName}</span>
                <span style="font-weight:bold">${sign}${pctReturn.toFixed(2)}%</span>
              </div>`;
           });
           return res;
        }
      },
      legend: { 
        data: [selectedStrategy.label, 'S&P 500'], 
        textStyle: { color: '#9ca3af' }, 
        top: 0 
      },
      xAxis: { 
        type: 'category', 
        data: dates, 
        axisLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#6b7280' }
      },
      yAxis: { 
        type: 'log', 
        min: 'dataMin',
        scale: true,
        splitLine: { lineStyle: { color: '#222', type: 'dashed' } }, 
        axisLabel: { 
            formatter: (val) => `${(val - 100).toFixed(0)}%`, 
            color: '#6b7280' 
        } 
      },
      series: [
        { 
          name: selectedStrategy.label, 
          type: 'line', 
          data: strategySeries, 
          showSymbol: false, 
          itemStyle: { color: '#fff' }, 
          lineStyle: { width: 2.5 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 255, 255, 0.15)' },
                { offset: 1, color: 'rgba(255, 255, 255, 0)' }
              ]
            }
          }
        },
        { 
          name: 'S&P 500', 
          type: 'line', 
          data: benchmarkSeries, 
          showSymbol: false, 
          itemStyle: { color: '#6b7280' }, 
          lineStyle: { width: 2, type: 'solid', opacity: 0.7 },
          connectNulls: true
        }
      ]
    };
  }, [strategyData, spyBenchmarkData, selectedStrategy]);


  return (
    <>
      <Helmet>
        <title>{selectedStrategy.label} - MAROT STRATEGIES</title>
        <meta name="description" content={`Explore performance metrics and historical data for the ${selectedStrategy.label} investment strategy by Marot Strategies.`} />
      </Helmet>
      
      <div className="bg-[#0b0c10] min-h-screen text-white font-sans selection:bg-gray-700 selection:text-white">
        <Header />
        
        <main className="pt-32 pb-20 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
               <div className="relative z-20 flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <button className="flex items-center gap-2 text-2xl md:text-3xl font-bold hover:text-blue-400 transition-colors">
                          {selectedStrategy.label}
                          <ChevronDown className="w-6 h-6 opacity-50" />
                       </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white min-w-[240px] max-h-[400px] overflow-y-auto">
                       {availableStrategies.map(s => (
                          <DropdownMenuItem 
                            key={s.id} 
                            onClick={() => setSelectedStrategyId(s.id)}
                            className="cursor-pointer focus:bg-gray-800 focus:text-white flex justify-between py-3"
                          >
                             <span className="font-medium">{s.label}</span>
                             {selectedStrategyId === s.id && <CheckCircle2 className="w-4 h-4 text-emerald-500"/>}
                          </DropdownMenuItem>
                       ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        toast({ title: "Refreshing Data..." });
                        refetchStrategy();
                        refetchSPY();
                    }}
                    className="opacity-50 hover:opacity-100"
                    title="Refresh data"
                  >
                      <RefreshCw className={`w-4 h-4 ${strategyLoading || spyLoading || spyMetricsLoading ? 'animate-spin' : ''}`} />
                  </Button>
               </div>
            </div>

            {strategyError && (
              <div className="mb-8 bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                 <div>
                    <h4 className="font-semibold mb-1">Data Load Error</h4>
                    <p className="text-sm opacity-80">{strategyError}</p>
                 </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedStrategyId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-16">
                   {(strategyLoading || strategiesNamesLoading) && !calculatedMetrics && !strategyError ? (
                      <div className="h-64 flex flex-col items-center justify-center gap-3 bg-gray-900/20 rounded-xl border border-gray-800">
                         <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                         <span className="text-gray-500">Loading strategy data...</span>
                      </div>
                   ) : (
                      <MetricsGrid 
                        metrics={calculatedMetrics}
                        spyMetrics={spyMetrics}
                        isLoading={strategyLoading || spyMetricsLoading}
                        error={strategyError}
                      />
                   )}
                </div>

                <div className="mb-20 bg-gray-900/30 border border-gray-800/50 rounded-xl p-4 md:p-8">
                   <div className="flex items-center gap-2 mb-6 pl-2 border-l-4 border-blue-500">
                      <h3 className="text-lg font-medium text-gray-300">Portfolio Growth vs S&P 500</h3>
                      {(spyLoading || strategyLoading) && <RefreshCw className="w-3 h-3 animate-spin text-gray-500"/>}
                   </div>
                   
                   <div className="h-[450px] w-full">
                      {strategyError ? (
                         <div className="h-full flex flex-col items-center justify-center text-red-400/80 gap-2 border border-red-500/20 rounded-lg bg-red-500/5">
                             <AlertCircle className="w-8 h-8" />
                             <span>Cannot render chart due to data loading error. Check console for deep diagnostic analysis.</span>
                         </div>
                      ) : strategyLoading || (!chartOption && !strategyError) ? (
                         <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                             <RefreshCw className="w-6 h-6 animate-spin" />
                             <span>Loading historical performance...</span>
                         </div>
                      ) : (
                         <ReactECharts 
                           option={chartOption} 
                           style={{ height: '100%', width: '100%' }} 
                           theme="dark"
                           notMerge={true}
                         />
                      )}
                   </div>
                </div>

              </motion.div>
            </AnimatePresence>

          </div>
        </main>
      </div>
    </>
  );
};

export default InvestmentStrategiesPage;