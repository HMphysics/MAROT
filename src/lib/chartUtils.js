/**
 * Builds a unified X-axis from multiple series with forward-fill
 * ONLY within each series' own [first, last] date range.
 *
 * - Before a series' first date → null
 * - Within [first, last] → forward-fill gaps with last known value
 * - After a series' last date → null (line ends)
 *
 * @param {Object} seriesMap - { id: [{date, value}], ... }
 * @returns {{ dates: string[], filled: { [id]: (number|null)[] } }}
 */
export function buildUnifiedAxis(seriesMap) {
  const dateSet = new Set();
  const seriesMeta = {}; // { id: { firstDate, lastDate, lookup } }

  for (const [id, data] of Object.entries(seriesMap)) {
    if (!data || data.length === 0) continue;
    const lookup = new Map();
    let firstDate = null;
    let lastDate = null;
    for (const p of data) {
      if (!p.date) continue;
      dateSet.add(p.date);
      lookup.set(p.date, p.value);
      if (!firstDate || p.date < firstDate) firstDate = p.date;
      if (!lastDate || p.date > lastDate) lastDate = p.date;
    }
    seriesMeta[id] = { firstDate, lastDate, lookup };
  }

  const dates = Array.from(dateSet).sort();
  const filled = {};

  for (const [id, data] of Object.entries(seriesMap)) {
    if (!data || data.length === 0 || !seriesMeta[id]) {
      filled[id] = new Array(dates.length).fill(null);
      continue;
    }

    const { firstDate, lastDate, lookup } = seriesMeta[id];
    const arr = new Array(dates.length);
    let lastKnown = null;

    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];

      if (d < firstDate || d > lastDate) {
        // Outside this series' data range → null
        arr[i] = null;
      } else if (lookup.has(d)) {
        lastKnown = lookup.get(d);
        arr[i] = lastKnown;
      } else {
        // Inside range, no exact point → forward-fill
        arr[i] = lastKnown;
      }
    }

    filled[id] = arr;
  }

  return { dates, filled };
}
