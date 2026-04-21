import { dualMomentum, marotMomentumV2 } from './strategies';
import { sp500, nasdaq } from './benchmarks';

export const strategies = [
  {
    id: 'dual-momentum',
    name: 'Dual Momentum',
    slug: 'dual-momentum',
    type: 'strategy',
    category: 'momentum',
    color: '#00FFFF',
    description: 'Dual Momentum strategy combining absolute and relative momentum signals.',
    inception_date: '2006-01-31',
    is_public: true,
    order: 1,
    data: dualMomentum,
  },
  {
    id: 'marot-momentum-v2',
    name: 'Marot Momentum V2',
    slug: 'marot-momentum-v2',
    type: 'strategy',
    category: 'momentum',
    color: '#A78BFA',
    description: 'Marot proprietary momentum model, second generation.',
    inception_date: '2022-01-07',
    is_public: true,
    order: 2,
    data: marotMomentumV2,
  },
];

export const benchmarks = [
  {
    id: 'sp500',
    name: 'S&P 500',
    slug: 'sp500',
    type: 'benchmark',
    category: 'index',
    color: '#6B7280',
    description: 'S&P 500 Total Return Index (Vanguard 500).',
    inception_date: '2006-01-31',
    is_public: true,
    order: 1,
    data: sp500,
  },
  {
    id: 'nasdaq',
    name: 'Nasdaq Composite',
    slug: 'nasdaq',
    type: 'benchmark',
    category: 'index',
    color: '#F59E0B',
    description: 'Nasdaq Composite Index.',
    inception_date: '2006-01-31',
    is_public: true,
    order: 2,
    data: nasdaq,
  },
];

export const registry = [...strategies, ...benchmarks];

export const getById = (id) => registry.find((item) => item.id === id);
export const getStrategies = () => strategies;
export const getBenchmarks = () => benchmarks;
