import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Search, Activity, CalendarClock, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { verifyTradeSequence } from '@/lib/strategyUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const DataValidationReport = ({ strategyData, initialBalance = 100000 }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    const trades = strategyData?.performanceSummary?.MarotMomentumModel2?.TradeHistory || [];
    const expectedEndBalance = strategyData?.performanceSummary?.MarotMomentumModel2?.EndBalance || 0;

    const reportData = {
      tradesAnalyzed: trades.length,
      priceChecks: [],
      chronology: { valid: true, issues: [] },
      returnVerification: null,
      score: 100
    };

    // 1. Return Calculation Verification (Task 5)
    reportData.returnVerification = verifyTradeSequence(trades, initialBalance, expectedEndBalance);

    // 2. Chronology Check (Task 2)
    let prevDate = new Date('2000-01-01');
    trades.forEach((trade, idx) => {
      const currDate = new Date(trade.date);
      if (currDate < prevDate) {
        reportData.chronology.valid = false;
        reportData.chronology.issues.push(`Trade #${idx + 1} (${trade.symbol}) date ${trade.date} is before previous trade.`);
        reportData.score -= 20;
      }
      prevDate = currDate;
    });

    // 3. Price Validation against Yahoo Finance (Task 4)
    // We check a sample or all. Let's check all unique date/symbol combos.
    const checks = [];
    for (const trade of trades) {
      // Skip validation for future dates relative to execution time
      const isFuture = new Date(trade.date) > new Date();
      if (isFuture) {
          checks.push({
            ...trade,
            status: 'SKIPPED',
            message: 'Future Date',
            marketPrice: 'N/A'
          });
          continue;
      }

      try {
        const { data: result, error } = await supabase.functions.invoke('fetch-daily-stock-data', {
          body: JSON.stringify({ 
             ticker: trade.symbol, 
             startDate: trade.date,
             endDate: trade.date // Just one day
          })
        });

        if (error || !result?.success || !result?.data?.length) {
           checks.push({ ...trade, status: 'WARNING', message: 'Data fetch failed or no data', marketPrice: 'N/A' });
           reportData.score -= 5;
           continue;
        }

        const dayData = result.data[0];
        // Check if trade price is within High/Low of the day
        const low = dayData.low;
        const high = dayData.high;
        const price = trade.price;
        
        // 2% Tolerance
        const inRange = price >= (low * 0.98) && price <= (high * 1.02);
        
        if (inRange) {
           checks.push({ 
               ...trade, 
               status: 'PASS', 
               marketRange: `${low.toFixed(2)} - ${high.toFixed(2)}`,
               diff: 'OK'
           });
        } else {
           checks.push({ 
               ...trade, 
               status: 'FAIL', 
               marketRange: `${low.toFixed(2)} - ${high.toFixed(2)}`,
               diff: `${((price - dayData.close)/dayData.close * 100).toFixed(2)}% off`
           });
           reportData.score -= 10;
        }

      } catch (e) {
         console.error(e);
         checks.push({ ...trade, status: 'ERROR', message: e.message });
      }
    }
    reportData.priceChecks = checks;
    
    // Final Score Floor
    reportData.score = Math.max(0, reportData.score);
    
    setReport(reportData);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
         <Button variant="outline" className="gap-2 border-gray-700 bg-gray-900/50 text-gray-300 hover:bg-gray-800 hover:text-white transition-all">
            <Activity className="w-4 h-4 text-emerald-500" />
            Audit Strategy Data
         </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-[#0f1115] border-gray-800 text-gray-200 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
             <Search className="w-5 h-5 text-blue-400" />
             Data Validation Report
          </DialogTitle>
          <DialogDescription className="text-gray-400">
             Comprehensive audit of trade execution, pricing accuracy, and return calculations.
          </DialogDescription>
        </DialogHeader>

        {!report && (
           <div className="py-12 flex flex-col items-center justify-center gap-4">
              <p className="text-gray-400 text-sm">Run a full audit against Yahoo Finance historical data.</p>
              <Button onClick={runValidation} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white min-w-[150px]">
                 {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Auditing...
                    </>
                 ) : (
                    'Run Validation'
                 )}
              </Button>
           </div>
        )}

        {report && (
          <div className="space-y-8 animate-in fade-in duration-500">
             
             {/* Summary Cards */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 p-4 rounded border border-gray-800 flex flex-col items-center justify-center">
                   <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Data Quality</span>
                   <div className={cn("text-2xl font-bold", 
                      report.score > 90 ? "text-emerald-400" : report.score > 70 ? "text-yellow-400" : "text-red-400"
                   )}>
                      {report.score}/100
                   </div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded border border-gray-800 flex flex-col items-center justify-center">
                   <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trades Analyzed</span>
                   <div className="text-2xl font-bold text-white">{report.tradesAnalyzed}</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded border border-gray-800 flex flex-col items-center justify-center">
                   <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Chronology</span>
                   <div className="text-2xl font-bold text-emerald-400">
                      {report.chronology.valid ? <CheckCircle2 className="w-6 h-6 inline" /> : <XCircle className="w-6 h-6 inline text-red-500" />}
                   </div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded border border-gray-800 flex flex-col items-center justify-center">
                   <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Return Claim</span>
                   <div className="text-xl font-bold text-white">
                      {report.returnVerification.totalReturn.toFixed(2)}%
                   </div>
                   <span className="text-[10px] text-gray-500">Calculated</span>
                </div>
             </div>

             {/* Return Verification Section */}
             <div className="border border-gray-800 rounded bg-gray-900/30 p-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                   <DollarSign className="w-4 h-4 text-emerald-500" />
                   Return Verification (Task 5)
                </h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-xs text-left">
                      <thead>
                         <tr className="border-b border-gray-800 text-gray-500">
                            <th className="pb-2">Symbol</th>
                            <th className="pb-2">Entry</th>
                            <th className="pb-2">Exit</th>
                            <th className="pb-2 text-right">Return %</th>
                            <th className="pb-2 text-right">PnL</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                         {report.returnVerification.positions.map((pos, i) => (
                            <tr key={i} className="hover:bg-white/5">
                               <td className="py-2 font-medium text-white">{pos.symbol}</td>
                               <td className="py-2 text-gray-400">{pos.entry} @ {pos.entryPrice.toFixed(2)}</td>
                               <td className="py-2 text-gray-400">
                                  {pos.exit} @ {pos.exitPrice.toFixed(2)}
                                  {pos.isImplied && <span className="ml-2 px-1 py-0.5 bg-blue-900/30 text-blue-400 text-[9px] rounded">OPEN</span>}
                               </td>
                               <td className={cn("py-2 text-right font-mono", pos.returnPct > 0 ? "text-emerald-400" : "text-red-400")}>
                                  {pos.returnPct > 0 ? '+' : ''}{pos.returnPct.toFixed(2)}%
                               </td>
                               <td className="py-2 text-right text-gray-300 font-mono">
                                  ${pos.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                      <tfoot>
                         <tr className="border-t border-gray-700 bg-white/5 font-semibold">
                            <td colSpan={3} className="py-3 pl-2 text-white">Total Portfolio Return</td>
                            <td className="py-3 text-right text-emerald-400">{report.returnVerification.totalReturn.toFixed(2)}%</td>
                            <td className="py-3 text-right text-white">${(report.returnVerification.verifiedBalance - initialBalance).toLocaleString()}</td>
                         </tr>
                      </tfoot>
                   </table>
                </div>
             </div>

             {/* Price Validation Table */}
             <div className="border border-gray-800 rounded bg-gray-900/30 p-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                   <CalendarClock className="w-4 h-4 text-blue-500" />
                   Historical Price Validation (Yahoo Finance)
                </h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-xs text-left">
                      <thead>
                         <tr className="border-b border-gray-800 text-gray-500">
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Symbol</th>
                            <th className="pb-2">Action</th>
                            <th className="pb-2 text-right">JSON Price</th>
                            <th className="pb-2 text-right">Market Range (Low-High)</th>
                            <th className="pb-2 text-center">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                         {report.priceChecks.map((check, i) => (
                            <tr key={i} className="hover:bg-white/5">
                               <td className="py-2 text-gray-400">{check.date}</td>
                               <td className="py-2 font-medium text-white">{check.symbol}</td>
                               <td className={cn("py-2 font-bold", check.action === 'BUY' ? "text-emerald-500" : "text-red-500")}>
                                  {check.action}
                               </td>
                               <td className="py-2 text-right text-gray-300">${check.price.toFixed(2)}</td>
                               <td className="py-2 text-right text-gray-500">{check.marketRange || 'N/A'}</td>
                               <td className="py-2 text-center">
                                  {check.status === 'PASS' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900">PASS</span>}
                                  {check.status === 'FAIL' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-900/30 text-red-400 border border-red-900">FAIL</span>}
                                  {check.status === 'WARNING' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-900">WARN</span>}
                                  {check.status === 'SKIPPED' && <span className="text-gray-600 text-[10px]">FUTURE</span>}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DataValidationReport;