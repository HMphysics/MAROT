# Marot Strategies — PRD

## What's Been Implemented

### Quant Strategies (/quant-strategies) - EN
- 7 strategies: Pulse, Helix, Vector, Vortex, Cascade, Equipoise, Invariant
- 4 benchmarks: S&P 500, Nasdaq 100, Gold, Equity & Gold 50/50
- Charts: Equity Curve, Drawdown, Rolling Sharpe, Risk/Return, Histogram, Correlation Heatmap
- Investment Calculator: Accumulation, Withdrawal, Mixed modes with XIRR
- Portfolio Builder (2026-05-08): mix up to 10 components with custom weights, rebalancing (monthly/quarterly/annually/never), allocation donut, equity curve, drawdown, full metrics table per-component vs portfolio. Paywalled for `research`/`total` tiers. Deep-link via `?tab=portfolio-builder`.
- Metrics Table always visible below charts
- Watermark "MAROT STRATEGIES" on all charts

### Auth System (2026-04-28)
- Supabase `profiles` table with role (admin/user) and subscription fields
- Auto-profile creation on signup via DB trigger
- Admin auto-detection for hardcoded email list
- ProtectedRoute component (requireAuth, requireAdmin, requireSubscription + showPaywall)
- Pages: /login, /signup, /account
- Header: auth-aware (login/signup vs avatar dropdown)
- /admin/* routes protected with requireAdmin

### Services Page (/services) - ES
- 3 pricing tiers: Marot Research (60€/mo), Marot Strategies (34€/mo), Marot Total (72€/mo)
- Monthly/Annual toggle with 28% savings badge
- FAQ section, custom CTA
- Placeholder for payment integration

### Research Terminal (/research?category=Terminal)
- Terminal tab alongside White Papers, Market Analysis
- Paywall for non-subscribers (lock icon + CTA to /services)
- Placeholder content for subscribers

## SQL Migration
Run `/supabase/migrations/001_profiles.sql` in Supabase SQL Editor.

## Activate subscription for testing
```sql
UPDATE public.profiles 
  SET subscription_tier = 'total', 
      subscription_status = 'active', 
      subscription_expires_at = '2027-01-01' 
  WHERE email = 'cyclefundinvest@gmail.com';
```

## Backlog
- P0: Stripe/payment integration for /services
- P1: Email verification flow
- P1: Password reset page
- P2: Monte Carlo simulation
- P2: PDF report generation
