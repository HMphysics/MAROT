import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, CheckCircle2, AlertTriangle, FileJson, RefreshCw, ChevronDown, Check, Activity, Wand2, Copy, BarChart3, DownloadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { validateStrategyDataIntegrity } from '@/lib/strategyUtils';
import { transformStrategyJSON } from '@/lib/jsonTransformer';

// Added UGARIT strategy to the management options so it can be correctly saved to strategy_data table
const STRATEGY_OPTIONS = [
  { id: 'strategy_data_1', label: 'Marot Model 1', key: 'DualMomentumModel' },
  { id: 'strategy_data_2', label: 'Marot Model 2', key: 'MarotMomentumModel2' },
  { id: 'strategy_data_3', label: 'Dual Momentum', key: 'Strategy3' },
  { id: 'strategy_data_4', label: 'Marot Momentum Model 2 (Alt)', key: 'MarotMomentumModel2_Alt' },
  { id: 'strategy_data', label: 'UGARIT', key: 'UGARIT' }
];

const StrategyManagementPage = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [transformedOutput, setTransformedOutput] = useState('');
  const [isValid, setIsValid] = useState(null); // null, true, false
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [recalculatingSpy, setRecalculatingSpy] = useState(false);
  
  // Data State for Report
  const [currentDbData, setCurrentDbData] = useState(null);
  const [dataReport, setDataReport] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedStrategy) {
        fetchCurrentStrategyData(selectedStrategy.id, selectedStrategy.key);
    } else {
        setCurrentDbData(null);
        setDataReport(null);
        setJsonInput('');
        setTransformedOutput('');
        setIsValid(null);
        setValidationMessage('');
        setValidationErrors([]);
    }
  }, [selectedStrategy]);

  // Real-time validation and transformation effect
  useEffect(() => {
    if (!jsonInput || !selectedStrategy) {
      if (!jsonInput) {
          setIsValid(null);
          setValidationMessage('');
          setValidationErrors([]);
          setTransformedOutput('');
      }
      return;
    }

    const timer = setTimeout(() => {
      // Run validation locally
      const result = transformStrategyJSON(jsonInput);
      
      if (result.success) {
        setIsValid(true);
        setValidationMessage("Valid JSON structure detected.");
        setValidationErrors([]);
        setTransformedOutput(JSON.stringify(result.data, null, 2));
      } else {
        // Only show error state if input looks like it's trying to be JSON
        if (jsonInput.trim().startsWith('{')) {
            setIsValid(false);
            setValidationMessage("Format issues detected:");
            setValidationErrors(result.errors);
            setTransformedOutput(''); // Clear output on error
        } else {
            setIsValid(null);
        }
      }
    }, 600); // Debounce validation

    return () => clearTimeout(timer);
  }, [jsonInput, selectedStrategy]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        toast({ title: "Unauthorized", description: "You must be logged in to view this page.", variant: "destructive" });
        navigate('/admin/login');
    }
  };

  const fetchCurrentStrategyData = async (tableId, strategyKey) => {
      setFetchingData(true);
      try {
          // Use maybeSingle to prevent "0 rows" error crash
          let query = supabase.from(tableId).select('data').order('created_at', { ascending: false }).limit(1);
          
          if (strategyKey && tableId === 'strategy_data') {
             query = query.ilike('file_name', `%${strategyKey}%`);
          }

          let { data, error } = await query.maybeSingle();

          if (!data && strategyKey && !error && tableId === 'strategy_data') {
              const fallback = await supabase.from(tableId).select('data').order('created_at', { ascending: false }).limit(1).maybeSingle();
              data = fallback.data;
              error = fallback.error;
          }
          
          if (error && error.code !== 'PGRST116') {
             console.error("Error fetching data", error);
             toast({ variant: "destructive", title: "Fetch Error", description: error.message });
          }

          if (data?.data) {
              const formattedJson = JSON.stringify(data.data, null, 2);
              setJsonInput(formattedJson);
              // Also set transformed output as the current DB data is assumed valid
              setTransformedOutput(formattedJson); 
              setCurrentDbData(data.data);
              
              const report = validateStrategyDataIntegrity(data.data, selectedStrategy.key);
              setDataReport(report);
              
              setValidationMessage("Data loaded from database.");
          } else {
              setJsonInput('');
              setTransformedOutput('');
              setCurrentDbData(null);
              setDataReport(null);
              setValidationMessage("No data found for this strategy yet.");
              setIsValid(null);
          }

      } catch (err) {
          console.error(err);
      } finally {
          setFetchingData(false);
      }
  };

  const handleManualTransform = async () => {
    if (!selectedStrategy || !jsonInput.trim()) return;

    setIsValidating(true);
    // Add small artificial delay to show processing state visually
    await new Promise(r => setTimeout(r, 400));
    
    const result = transformStrategyJSON(jsonInput);

    if (result.success) {
        setIsValid(true);
        setValidationMessage("Validation successful. Data transformed.");
        setTransformedOutput(JSON.stringify(result.data, null, 2));
        
        toast({
            title: "Transformation Complete",
            description: "JSON has been standardized and is ready to save.",
            className: "bg-emerald-900 border-emerald-800 text-white"
        });
    } else {
        setIsValid(false);
        setValidationMessage("Validation Failed:");
        setValidationErrors(result.errors || ["Unknown error"]);
        
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please check the error messages below the input."
        });
    }
    setIsValidating(false);
  };

  const copyToClipboard = () => {
    if (!transformedOutput) return;
    navigator.clipboard.writeText(transformedOutput);
    toast({
      title: "Copied!",
      description: "Transformed JSON copied to clipboard.",
    });
  };

  const initiateUpdate = () => {
    if (isValid && transformedOutput) {
      setShowConfirmDialog(true);
    } else {
        toast({
            title: "Validation Required",
            description: "Please ensure you have valid transformed data before saving.",
            variant: "destructive"
        });
    }
  };

  const handleManualSpyDownload = async () => {
      if (!currentDbData || !currentDbData.portfolioGrowth || currentDbData.portfolioGrowth.length === 0) {
          toast({ variant: "destructive", title: "Missing Data", description: "No portfolio data to determine date range."});
          return;
      }

      setRecalculatingSpy(true);
      try {
          // Extract dates
          const sorted = [...currentDbData.portfolioGrowth].sort((a,b) => new Date(a.date) - new Date(b.date));
          const startDate = sorted[0].date;
          const endDate = sorted[sorted.length-1].date;

          const { data, error } = await supabase.functions.invoke('process-strategy-upload', {
              body: JSON.stringify({ startDate, endDate, strategyKey: selectedStrategy.key })
          });

          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          toast({
              title: "SPY Data Downloaded",
              description: "Historical data fetched and metrics recalculated successfully.",
              className: "bg-green-900 border-green-800 text-white"
          });

      } catch (err) {
          console.error(err);
          toast({
              variant: "destructive",
              title: "Download Failed",
              description: err.message
          });
      } finally {
          setRecalculatingSpy(false);
      }
  };

  const handleConfirmUpdate = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      // Use the transformed output as the source of truth for saving
      const parsedData = JSON.parse(transformedOutput);
      const targetTable = selectedStrategy.id;
      const targetFileName = `${selectedStrategy.label.replace(/\s+/g, '_')}_latest.json`;

      // Check if row exists for this strategy
      // ORDER BY created_at is strictly maintained here to fetch the newest entry
      let query = supabase.from(targetTable).select('id').order('created_at', { ascending: false }).limit(1);
      
      // Only apply ilike for shared tables like strategy_data
      if (targetTable === 'strategy_data') {
          query = query.ilike('file_name', `%${selectedStrategy.key}%`);
      }

      const { data: existingRows } = await query;

      let error;
      if (existingRows && existingRows.length > 0) {
         const { error: updateError } = await supabase
           .from(targetTable)
           .update({ 
             data: parsedData, 
             file_name: targetFileName,
             updated_at: new Date().toISOString()
           })
           .eq('id', existingRows[0].id);
         error = updateError;
      } else {
         const { error: insertError } = await supabase
           .from(targetTable)
           .insert({
              data: parsedData,
              file_name: targetFileName,
              created_at: new Date().toISOString()
           });
         error = insertError;
      }

      if (error) throw error;

      // --- TRIGGER SPY DOWNLOAD ---
      if (parsedData.portfolioGrowth && parsedData.portfolioGrowth.length > 0) {
          const sorted = [...parsedData.portfolioGrowth].sort((a,b) => new Date(a.date) - new Date(b.date));
          const startDate = sorted[0].date;
          const endDate = sorted[sorted.length-1].date;

          // Call edge function asynchronously (fire and forget toast)
          supabase.functions.invoke('process-strategy-upload', {
              body: JSON.stringify({ startDate, endDate, strategyKey: selectedStrategy.key })
          }).then(({ data, error }) => {
              if (!error && !data?.error) {
                 toast({
                    title: "Benchmark Updated",
                    description: "SPY data downloaded and metrics calculated for comparison.",
                    className: "bg-blue-900 border-blue-800 text-white",
                    duration: 5000
                 });
              } else {
                  console.error("Auto SPY update failed", error || data?.error);
              }
          });
      }
      
      toast({
        title: "Success",
        description: `${selectedStrategy.label} has been updated!`,
        className: "bg-green-900 border-green-800 text-white"
      });
      
      // Update local report
      const report = validateStrategyDataIntegrity(parsedData, selectedStrategy.key);
      setDataReport(report);
      setCurrentDbData(parsedData);
      
      // Update the input to match the saved data
      setJsonInput(transformedOutput);

    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Update Error",
        description: `Could not update ${selectedStrategy.label}: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-6 md:p-12">
      <Helmet><title>Manage Strategies - Admin</title></Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Input and Controls */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl h-fit">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <FileJson className="w-6 h-6 text-blue-400"/> Strategy Data Manager
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Paste your raw JSON. The system will auto-format and validate it.
                        </p>
                    </div>
                    
                    {/* Strategy Selector */}
                    <div className="min-w-[240px]">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Select Strategy</label>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between bg-gray-950 border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white">
                            {selectedStrategy ? selectedStrategy.label : "Select a Strategy"}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[240px] bg-gray-950 border-gray-800 text-gray-200">
                            {STRATEGY_OPTIONS.map((option) => (
                            <DropdownMenuItem 
                                key={option.id}
                                onClick={() => setSelectedStrategy(option)}
                                className="cursor-pointer focus:bg-gray-800 focus:text-white flex justify-between items-center"
                            >
                                {option.label}
                                {selectedStrategy?.id === option.id && <Check className="w-4 h-4 text-emerald-500" />}
                            </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* INPUT SECTION */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase font-semibold">Input (Raw JSON)</label>
                    <textarea
                        value={jsonInput}
                        disabled={!selectedStrategy || fetchingData || isValidating}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder={fetchingData ? "Loading..." : (selectedStrategy ? 'Paste JSON here...' : "Select strategy first")}
                        className={cn(
                            "w-full h-80 bg-[#0f1115] border rounded-lg p-3 font-mono text-xs focus:outline-none transition-all resize-none",
                            !selectedStrategy 
                            ? "border-gray-800 text-gray-600 cursor-not-allowed" 
                            : "border-gray-700 text-gray-300 focus:border-blue-500",
                            isValid === false && "border-red-900/50 focus:border-red-500"
                        )}
                    />
                  </div>

                  {/* OUTPUT SECTION */}
                  <div className="space-y-2 relative">
                    <div className="flex justify-between items-center">
                        <label className="text-xs text-emerald-500 uppercase font-semibold">Output (Transformed)</label>
                        {transformedOutput && (
                            <button onClick={copyToClipboard} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                                <Copy className="w-3 h-3" /> Copy
                            </button>
                        )}
                    </div>
                    <textarea
                        readOnly
                        value={transformedOutput}
                        placeholder="Transformed JSON will appear here..."
                        className={cn(
                            "w-full h-80 bg-[#0a0b0e] border border-gray-800 rounded-lg p-3 font-mono text-xs text-emerald-400/90 focus:outline-none resize-none",
                            !transformedOutput && "text-gray-700 italic"
                        )}
                    />
                  </div>
                </div>

                {/* STATUS & ACTIONS */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 bg-gray-950/50 rounded-lg border border-gray-800">
                    <div className="flex-1">
                        {isValid === true && (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                <CheckCircle2 className="w-5 h-5" />
                                <div>
                                <p className="font-semibold">Ready to Save</p>
                                <p className="text-emerald-400/70 text-xs">Data transformed successfully.</p>
                                </div>
                            </div>
                        )}
                        {isValid === false && (
                            <div className="flex items-start gap-2 text-red-400 text-sm">
                                <AlertTriangle className="w-5 h-5 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{validationMessage}</p>
                                    {validationErrors.length > 0 && (
                                        <ul className="mt-1 list-disc list-inside text-xs text-red-400/80 space-y-1">
                                            {validationErrors.slice(0, 3).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                            {validationErrors.length > 3 && <li>...and {validationErrors.length - 3} more</li>}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                        {isValid === null && (
                            <p className="text-gray-500 text-sm italic">
                            {selectedStrategy ? "Paste JSON to begin automatic transformation" : "Waiting for selection..."}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={handleManualTransform}
                            disabled={!selectedStrategy || !jsonInput || isValidating}
                            className="flex-1 md:flex-none border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                            {isValidating ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin"/> Processing...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2"/> Force Transform
                                </>
                            )}
                        </Button>
                        <Button 
                            onClick={initiateUpdate}
                            disabled={!isValid || loading || !selectedStrategy || !transformedOutput}
                            className={cn(
                            "flex-1 md:flex-none min-w-[140px]",
                            isValid ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-700 text-gray-400"
                            )}
                        >
                            {loading ? (
                                <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin"/> Saving...
                                </>
                            ) : (
                                <>
                                <Save className="w-4 h-4 mr-2"/> Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: Data Report */}
            <div className="lg:col-span-1">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-full sticky top-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" /> 
                        Current DB Status
                    </h3>
                    
                    {!selectedStrategy ? (
                        <div className="text-gray-500 text-sm italic p-4 border border-dashed border-gray-800 rounded">
                            Select a strategy to view its current database report.
                        </div>
                    ) : fetchingData ? (
                        <div className="flex items-center gap-2 text-blue-400 text-sm">
                             <RefreshCw className="w-4 h-4 animate-spin"/> Loading report...
                        </div>
                    ) : !dataReport ? (
                        <div className="text-yellow-500 text-sm">
                             No existing data found in database.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className={`p-4 rounded-lg border ${dataReport.valid ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {dataReport.valid ? <CheckCircle2 className="w-5 h-5 text-emerald-500"/> : <AlertTriangle className="w-5 h-5 text-red-500"/>}
                                    <span className={`font-bold ${dataReport.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {dataReport.valid ? "Healthy Data" : "Data Issues"}
                                    </span>
                                </div>
                                {!dataReport.valid && (
                                    <ul className="list-disc list-inside text-xs text-red-300 mt-2 space-y-1">
                                        {dataReport.errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                                    <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-3">Stored Statistics</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Data Points</span>
                                            <span className="text-white font-mono">{dataReport?.meta?.dataPoints ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Recorded Trades</span>
                                            <span className="text-white font-mono">{dataReport?.meta?.tradeCount ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Equity Curve</span>
                                            <span className={dataReport?.meta?.dataPoints > 0 ? "text-emerald-400" : "text-gray-600"}>
                                                {dataReport?.meta?.dataPoints > 0 ? "Present" : "Missing"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleManualSpyDownload}
                                    disabled={recalculatingSpy || !dataReport.valid}
                                    variant="outline"
                                    className="w-full border-blue-900/50 bg-blue-900/10 text-blue-300 hover:bg-blue-900/20 hover:text-blue-100"
                                >
                                    {recalculatingSpy ? (
                                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin"/> Downloading...</>
                                    ) : (
                                        <><DownloadCloud className="w-4 h-4 mr-2"/> Download SPY & Recalculate</>
                                    )}
                                </Button>
                                <p className="text-xs text-gray-500 text-center px-2">
                                    Forces a download of historical SPY data from Yahoo Finance corresponding to this strategy's date range.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-[#0f1115] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Update {selectedStrategy?.label}?</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will overwrite the existing data for <strong>{selectedStrategy?.label}</strong> with the content of the "Output" box. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowConfirmDialog(false)} className="text-gray-400 hover:text-white hover:bg-gray-800">
              Cancel
            </Button>
            <Button onClick={handleConfirmUpdate} className="bg-blue-600 hover:bg-blue-500 text-white">
              Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StrategyManagementPage;