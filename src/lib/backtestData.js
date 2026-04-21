export const generateBacktestData = () => {
  const startDate = new Date('2020-01-01');
  const endDate = new Date('2024-12-31');
  const dates = [];
  const strategy = [];
  const qqq = [];
  const spy = [];

  let currentDate = new Date(startDate);
  let strategyValue = 100;
  let qqqValue = 100;
  let spyValue = 100;

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    
    const strategyReturn = (Math.random() * 0.04 - 0.01) + 0.015;
    const qqqReturn = (Math.random() * 0.03 - 0.01) + 0.012;
    const spyReturn = (Math.random() * 0.025 - 0.01) + 0.01;

    strategyValue *= (1 + strategyReturn);
    qqqValue *= (1 + qqqReturn);
    spyValue *= (1 + spyReturn);

    strategy.push(((strategyValue - 100) / 100 * 100).toFixed(2));
    qqq.push(((qqqValue - 100) / 100 * 100).toFixed(2));
    spy.push(((spyValue - 100) / 100 * 100).toFixed(2));

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return { dates, strategy, qqq, spy };
};

export const generateAnnualReturns = () => {
  const years = ['2020', '2021', '2022', '2023', '2024'];
  const returns = [15.2, 22.8, -8.4, 18.6, 21.3];
  
  return { years, returns };
};

export const generateDrawdownData = () => {
  const data = generateBacktestData();
  const dates = data.dates;
  const values = [];
  
  let peak = 0;
  data.strategy.forEach(value => {
    const numValue = parseFloat(value);
    if (numValue > peak) peak = numValue;
    const drawdown = ((numValue - peak) / peak * 100).toFixed(2);
    values.push(Math.min(0, parseFloat(drawdown)));
  });

  return { dates, values };
};