/**
 * Tolerant series normalizer.
 * Accepts any JSON and returns [{date: ISO, value: number}] sorted by date.
 */

const DATE_KEYS = ['date', 'fecha', 'time', 'timestamp', 'Date', 'Fecha', 'Time'];
const VALUE_KEYS = ['value', 'equity', 'close', 'nav', 'valor', 'Close', 'Value', 'Equity', 'NAV'];

function parseDate(raw) {
  if (!raw) return null;

  // Already a Date
  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? null : raw;
  }

  // Number — could be Unix timestamp (seconds or ms) or Excel serial
  if (typeof raw === 'number') {
    if (raw > 25569 && raw < 60000) {
      // Excel serial date
      const d = new Date((raw - 25569) * 86400000);
      return isNaN(d.getTime()) ? null : d;
    }
    if (raw > 1e12) return new Date(raw);       // ms timestamp
    if (raw > 1e9) return new Date(raw * 1000);  // seconds timestamp
    return null;
  }

  const s = String(raw).trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmm = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (ddmm) {
    const [, day, month, year] = ddmm;
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO or other parseable strings
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function extractDate(obj) {
  for (const key of DATE_KEYS) {
    if (obj[key] !== undefined) {
      const d = parseDate(obj[key]);
      if (d) return d;
    }
  }
  // Fallback: try any key that parses as a date
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && v.match(/^\d{4}[-/]\d{2}/)) {
      const d = parseDate(v);
      if (d) return d;
    }
  }
  return null;
}

function extractValue(obj) {
  for (const key of VALUE_KEYS) {
    if (obj[key] !== undefined && obj[key] !== null) {
      const n = Number(obj[key]);
      if (!isNaN(n)) return n;
    }
  }

  // OHLC — use close
  if (obj.close !== undefined) return Number(obj.close);
  if (obj.Close !== undefined) return Number(obj.Close);

  // Fallback: first numeric field that isn't the date
  for (const [k, v] of Object.entries(obj)) {
    if (DATE_KEYS.includes(k)) continue;
    const n = Number(v);
    if (!isNaN(n) && v !== null && v !== '') return n;
  }
  return null;
}

/**
 * @param {Array|Object} input - Raw JSON data
 * @param {Object} [options]
 * @param {string} [options.rebaseDate] - ISO date to rebase series to 100
 * @param {number} [options.rebaseValue] - Base value (default 100)
 * @returns {Array<{date: string, value: number}>}
 */
export function normalizeSeries(input, options = {}) {
  let arr = input;

  // If object with a single array property, extract it
  if (!Array.isArray(arr) && typeof arr === 'object' && arr !== null) {
    const arrays = Object.values(arr).filter(Array.isArray);
    if (arrays.length === 1) {
      arr = arrays[0];
    } else if (arrays.length > 1) {
      // Pick the longest array
      arr = arrays.reduce((a, b) => (a.length >= b.length ? a : b));
    } else {
      throw new Error('Input object does not contain any array of data points.');
    }
  }

  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error('Input must be a non-empty array or object containing an array.');
  }

  const parsed = [];
  const errors = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!item || typeof item !== 'object') {
      errors.push(`Row ${i}: not an object`);
      continue;
    }

    const date = extractDate(item);
    const value = extractValue(item);

    if (!date) {
      errors.push(`Row ${i}: could not parse date from ${JSON.stringify(item)}`);
      continue;
    }
    if (value === null) {
      errors.push(`Row ${i}: could not parse numeric value from ${JSON.stringify(item)}`);
      continue;
    }

    parsed.push({ date: date.toISOString().split('T')[0], value });
  }

  if (parsed.length === 0) {
    throw new Error(`Could not parse any data points. Errors:\n${errors.slice(0, 5).join('\n')}`);
  }

  // Sort by date ascending
  parsed.sort((a, b) => a.date.localeCompare(b.date));

  // Rebase to 100 at given date
  if (options.rebaseDate) {
    const base = options.rebaseValue || 100;
    // Find the closest date >= rebaseDate
    const idx = parsed.findIndex((p) => p.date >= options.rebaseDate);
    if (idx < 0) return parsed; // rebaseDate is after all data

    const rebaseVal = parsed[idx].value;
    if (rebaseVal === 0) return parsed;

    return parsed.map((p) => ({
      date: p.date,
      value: (p.value / rebaseVal) * base,
    }));
  }

  return parsed;
}
