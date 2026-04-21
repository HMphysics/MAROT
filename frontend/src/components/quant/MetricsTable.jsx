import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fmtPct = (val) => {
  if (val === undefined || val === null || !isFinite(val)) return 'N/A';
  return `${(val * 100).toFixed(2)}%`;
};

const fmtNum = (val, decimals = 2) => {
  if (val === undefined || val === null || !isFinite(val)) return 'N/A';
  return val.toFixed(decimals);
};

const fmtDays = (val) => {
  if (val === undefined || val === null || !isFinite(val)) return 'N/A';
  return `${val}d`;
};

const columns = [
  { key: 'name', label: '', align: 'left' },
  { key: 'cagr', label: 'CAGR', fmt: fmtPct },
  { key: 'totalReturn', label: 'Total Return', fmt: fmtPct },
  { key: 'vol', label: 'Vol', fmt: fmtPct },
  { key: 'sharpe', label: 'Sharpe', fmt: fmtNum },
  { key: 'sortino', label: 'Sortino', fmt: fmtNum },
  { key: 'calmar', label: 'Calmar', fmt: fmtNum },
  { key: 'maxDD', label: 'Max DD', fmt: fmtPct },
  { key: 'maxDDDuration', label: 'DD Duration', fmt: fmtDays },
  { key: 'bestYear', label: 'Best Year', fmt: fmtPct },
  { key: 'worstYear', label: 'Worst Year', fmt: fmtPct },
  { key: 'positiveMonths', label: '% Pos Months', fmt: (v) => fmtNum(v, 1) + '%' },
  { key: 'beta', label: 'Beta', fmt: fmtNum },
  { key: 'alpha', label: 'Alpha', fmt: fmtPct },
  { key: 'correlation', label: 'Corr', fmt: fmtNum },
  { key: 'trackingError', label: 'TE', fmt: fmtPct },
  { key: 'infoRatio', label: 'IR', fmt: fmtNum },
];

const MetricsTable = ({ selectedItems, registry, metricsMap }) => {
  const rows = selectedItems
    .map((id) => {
      const item = registry.find((r) => r.id === id);
      const m = metricsMap[id];
      if (!item || !m) return null;
      return { ...m, name: item.name, color: item.color, type: item.type };
    })
    .filter(Boolean);

  const handleExportCSV = () => {
    const header = columns.map((c) => c.label || c.key).join(',');
    const csvRows = rows.map((row) =>
      columns.map((col) => {
        if (col.key === 'name') return `"${row.name}"`;
        const val = row[col.key];
        if (val === undefined || val === null || !isFinite(val)) return '';
        return val;
      }).join(',')
    );
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quant_metrics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (rows.length === 0) {
    return <div className="text-gray-500 text-center py-8">Select items to view metrics</div>;
  }

  return (
    <div data-testid="metrics-table">
      <div className="flex justify-end mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportCSV}
          className="text-gray-400 hover:text-white text-xs gap-1.5"
          data-testid="export-csv-btn"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 font-medium text-gray-400 whitespace-nowrap ${col.align === 'left' ? 'text-left' : 'text-right'}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                {columns.map((col) => {
                  if (col.key === 'name') {
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-left whitespace-nowrap font-medium">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: row.color }}
                          />
                          <span className="text-white">{row.name}</span>
                          {row.type === 'benchmark' && (
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                              bench
                            </span>
                          )}
                        </span>
                      </td>
                    );
                  }
                  const val = row[col.key];
                  const formatted = col.fmt ? col.fmt(val) : val;
                  return (
                    <td key={col.key} className="px-3 py-2.5 text-right whitespace-nowrap font-mono text-gray-300">
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricsTable;
