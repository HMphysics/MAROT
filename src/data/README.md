# Quant Strategies — Data Directory

## How to add a new Strategy or Benchmark

### 1. Add the data file

Place a JSON file in the appropriate folder:

- **Strategy** → `src/data/strategies/my-strategy.json`
- **Benchmark** → `src/data/benchmarks/my-benchmark.json`

The JSON should be an **array of objects** with at least `date` and `value` fields:

```json
[
  { "date": "2020-01-31", "value": 10000 },
  { "date": "2020-02-29", "value": 10250 },
  ...
]
```

The normalizer also accepts: `{date, equity}`, `{date, close}`, `{date, nav}`, `{fecha, valor}`, OHLC format (uses `close`), and various date formats (ISO, DD/MM/YYYY, timestamps, Excel serial dates).

### 2. Register in `registry.js`

Open `src/data/registry.js` and:

1. Import your JSON at the top:
```js
import myStrategy from './strategies/my-strategy.json';
```

2. Add an entry to the `strategies` or `benchmarks` array:
```js
{
  id: 'my-strategy',           // unique identifier
  name: 'My Strategy',         // display name
  slug: 'my-strategy',         // URL-safe slug
  type: 'strategy',            // 'strategy' or 'benchmark'
  category: 'momentum',        // free-form category
  color: '#FF6B6B',            // hex color for charts
  description: 'Description',  // short description
  inception_date: '2020-01-31', // first data point date
  is_public: true,             // show in the UI
  order: 3,                    // display order
  data: myStrategy,            // the imported JSON
}
```

3. If it's a strategy, also add to the import in `src/data/strategies/index.js`.
   If it's a benchmark, add to `src/data/benchmarks/index.js`.

### 3. Done!

The app will automatically detect and display it in the Quant Strategies page.
The color you define in the registry will be used consistently across all charts.

## Data Schema

Each series is normalized by `src/lib/seriesNormalizer.js` into:
```
[{ date: "YYYY-MM-DD", value: number }, ...]
```

The normalizer is tolerant and accepts many input formats. If it can't parse your data, it will throw a clear error message.
