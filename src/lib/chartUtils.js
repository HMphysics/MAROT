/**
 * Builds a unified X-axis from multiple series with forward-fill for mixed frequencies.
 * @param {Object} seriesMap - { id: [{date, value}], ... }
 * @returns {{ dates: string[], filled: { [id]: (number|null)[] } }}
 */
export function buildUnifiedAxis(seriesMap) {
  // Collect all unique dates across every series
  const dateSet = new Set();
  for (const data of Object.values(seriesMap)) {
    if (!data) continue;
    for (const p of data) {
      if (p.date) dateSet.add(p.date);
    }
  }

  const dates = Array.from(dateSet).sort();
  const filled = {};

  for (const [id, data] of Object.entries(seriesMap)) {
    if (!data || data.length === 0) {
      filled[id] = new Array(dates.length).fill(null);
      continue;
    }

    // Build a lookup from this series' own dates
    const lookup = new Map();
    for (const p of data) {
      lookup.set(p.date, p.value);
    }

    const firstDate = data[0].date;
    const arr = new Array(dates.length);
    let lastKnown = null;

    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      if (lookup.has(d)) {
        lastKnown = lookup.get(d);
        arr[i] = lastKnown;
      } else if (d < firstDate) {
        // Before the series starts → null (don't invent data backwards)
        arr[i] = null;
      } else {
        // Forward-fill from last known value
        arr[i] = lastKnown;
      }
    }

    filled[id] = arr;
  }

  return { dates, filled };
}
