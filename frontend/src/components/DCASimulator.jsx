import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { calculateDCA } from '@/lib/dcaCalculator';

const DCASimulator = () => {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      initialAmount: 10000,
      monthlyContribution: 500
    }
  });

  const [startDate, setStartDate] = useState(new Date('2020-01-01'));
  const [endDate, setEndDate] = useState(new Date());
  const [results, setResults] = useState(null);

  const onSubmit = (data) => {
    if (startDate >= endDate) {
      toast({
        title: 'Error',
        description: 'La fecha inicial debe ser anterior a la fecha final',
        variant: 'destructive'
      });
      return;
    }

    const calculatedResults = calculateDCA(
      parseFloat(data.initialAmount),
      parseFloat(data.monthlyContribution),
      startDate,
      endDate
    );

    setResults(calculatedResults);
    
    toast({
      title: 'Simulación completada',
      description: 'Los resultados se han calculado exitosamente'
    });
  };

  return (
    <section className="py-20 px-4 bg-[#0b0c10]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Test Our Strategy</h2>
          <p className="text-gray-400 text-lg">DCA Simulator - Dollar Cost Averaging</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#1a1c1f] rounded-2xl p-8 border border-gray-800 card-glow"
          >
            <h3 className="text-2xl font-semibold mb-6 text-cyan-400">Simulation Parameters</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  className="w-full bg-[#0b0c10] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  className="w-full bg-[#0b0c10] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Amount ($)
                </label>
                <input
                  type="number"
                  {...register('initialAmount', { required: true, min: 0 })}
                  className="w-full bg-[#0b0c10] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Monthly Contribution ($)
                </label>
                <input
                  type="number"
                  {...register('monthlyContribution', { required: true, min: 0 })}
                  className="w-full bg-[#0b0c10] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-black font-semibold py-6 rounded-lg transition-all duration-300"
              >
                Run Simulation
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#1a1c1f] rounded-2xl p-8 border border-gray-800 card-glow"
          >
            <h3 className="text-2xl font-semibold mb-6 text-cyan-400">Results</h3>
            
            {results ? (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Final Value</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">CAGR</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Max DD</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800 hover:bg-[#0b0c10] transition-colors">
                        <td className="py-4 px-4 font-semibold text-cyan-400">Strategy</td>
                        <td className="py-4 px-4 text-right font-bold">${results.strategy.finalValue.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-green-400">{results.strategy.cagr}%</td>
                        <td className="py-4 px-4 text-right text-red-400">{results.strategy.maxDrawdown}%</td>
                      </tr>
                      <tr className="border-b border-gray-800 hover:bg-[#0b0c10] transition-colors">
                        <td className="py-4 px-4 font-semibold text-blue-400">QQQ</td>
                        <td className="py-4 px-4 text-right font-bold">${results.qqq.finalValue.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-green-400">{results.qqq.cagr}%</td>
                        <td className="py-4 px-4 text-right text-red-400">{results.qqq.maxDrawdown}%</td>
                      </tr>
                      <tr className="hover:bg-[#0b0c10] transition-colors">
                        <td className="py-4 px-4 font-semibold text-gray-400">SPY</td>
                        <td className="py-4 px-4 text-right font-bold">${results.spy.finalValue.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-green-400">{results.spy.cagr}%</td>
                        <td className="py-4 px-4 text-right text-red-400">{results.spy.maxDrawdown}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#0b0c10] rounded-lg p-6 border border-gray-800">
                  <h4 className="text-lg font-semibold mb-4 text-cyan-400">Performance Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Invested:</span>
                      <span className="font-semibold">${results.totalInvested.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Strategy Outperformance vs QQQ:</span>
                      <span className="font-semibold text-green-400">
                        ${(results.strategy.finalValue - results.qqq.finalValue).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Strategy Outperformance vs SPY:</span>
                      <span className="font-semibold text-green-400">
                        ${(results.strategy.finalValue - results.spy.finalValue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 text-lg">Run a simulation to see results</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DCASimulator;