import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Sparkles, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';

const plans = [
  {
    tier: 'research',
    name: 'Marot Research',
    subtitle: 'Deep quantitative research',
    icon: Sparkles,
    monthly: 6000,
    annual: 51840,
    annualSavings: 20160,
    features: [
      'Terminal with proprietary indicators',
      'Proprietary AI for stock analysis',
      'Quantitative stock analysis models',
      'Premium research articles',
      'Daily indicator updates',
    ],
    cta: 'Subscribe to Research',
    highlight: false,
    badge: null,
  },
  {
    tier: 'strategies',
    name: 'Marot Strategies',
    subtitle: 'Live signals and strategies',
    icon: Zap,
    monthly: 3400,
    annual: 29376,
    annualSavings: 11424,
    features: [
      'Private group with investment ideas',
      'Real-time signals from quant strategies',
      'Live commentary and rebalancing',
      'Active community of investors',
    ],
    cta: 'Subscribe to Strategies',
    highlight: false,
    badge: null,
  },
  {
    tier: 'total',
    name: 'Marot Total',
    subtitle: 'Research + Strategies, all included',
    icon: Crown,
    monthly: 7200,
    annual: 62208,
    annualSavings: 24192,
    features: [
      'Everything in Marot Research',
      'Everything in Marot Strategies',
      'Priority access to new strategies',
      'Exclusive monthly webinars',
      'Direct team support',
    ],
    cta: 'Subscribe to Total',
    highlight: true,
    badge: 'Most popular',
  },
];

const fmtPrice = (cents) => {
  const euros = cents / 100;
  return '€' + euros.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const faqs = [
  { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. You will retain access until the end of the current billing period.' },
  { q: 'Is there a trial period?', a: 'We don\'t offer a free trial, but you can cancel within the first 7 days for a full refund.' },
  { q: 'Which payment methods do you accept?', a: 'We accept credit/debit cards (Visa, Mastercard, AMEX). Bank transfer and PayPal support coming soon.' },
  { q: 'Can I change my plan?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes are applied on a prorated basis.' },
  { q: 'Do prices include VAT?', a: 'Prices shown do not include VAT. The applicable VAT will be charged based on your country of residence.' },
  { q: 'How do I access premium content?', a: 'Once subscribed, all premium content is automatically unlocked when you sign in with your account.' },
];

const ServicesPage = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = (tier) => {
    if (!user) {
      window.location.href = `/signup?intent=${tier}`;
      return;
    }
    toast({
      title: 'Coming soon',
      description: 'Coming soon: card payments. In the meantime, contact info@marotstrategies.com to activate your subscription.',
    });
  };

  return (
    <>
      <Helmet>
        <title>Services - MAROT STRATEGIES</title>
        <meta name="description" content="Marot Strategies subscription plans: Research, Strategies and Total." />
      </Helmet>
      <div className="min-h-screen bg-[#0b0c10] text-white">
        <Header />

        <main className="pt-32 pb-20 px-4 md:px-8">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our services</h1>
            <p className="text-xl text-zinc-400">Quantitative tools and investment signals to make decisions with an edge.</p>
          </motion.div>

          {/* Toggle */}
          <div className="flex justify-center items-center gap-4 mb-14">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-cyan-600' : 'bg-zinc-700'}`}
              data-testid="pricing-toggle"
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>Annual</span>
            {isAnnual && (
              <span className="text-xs font-bold bg-cyan-900/40 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-800/50">
                Save 28%
              </span>
            )}
          </div>

          {/* Pricing cards */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {plans.map((plan, idx) => {
              const Icon = plan.icon;
              const price = isAnnual ? plan.annual : plan.monthly;
              const monthlyEquiv = isAnnual ? Math.round(plan.annual / 12) : null;

              return (
                <motion.div
                  key={plan.tier}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative rounded-2xl p-8 flex flex-col ${
                    plan.highlight
                      ? 'bg-zinc-900/80 border-2 border-cyan-500/60 shadow-lg shadow-cyan-900/20'
                      : 'bg-zinc-900/40 border border-zinc-800'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full ${
                      plan.highlight
                        ? 'bg-cyan-500 text-black'
                        : 'bg-zinc-700 text-zinc-200'
                    }`}>
                      {plan.badge}
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-6 h-6 ${plan.highlight ? 'text-cyan-400' : 'text-zinc-400'}`} />
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-zinc-500 text-sm mb-6">{plan.subtitle}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">{fmtPrice(price)}</span>
                    <span className="text-zinc-500 text-sm">/{isAnnual ? 'year' : 'month'}</span>
                    {isAnnual && monthlyEquiv && (
                      <p className="text-zinc-500 text-sm mt-1">
                        ≈ {fmtPrice(monthlyEquiv)}/month — <span className="text-cyan-400">Save {fmtPrice(plan.annualSavings)}</span>
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-cyan-400' : 'text-zinc-500'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.tier)}
                    className={`w-full py-6 rounded-lg font-bold text-base ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-500 hover:to-cyan-400'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Custom CTA — above FAQ */}
          <div className="max-w-2xl mx-auto text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl p-10 mb-24">
            <h2 className="text-2xl font-bold mb-3">Need something custom?</h2>
            <p className="text-zinc-400 mb-6">We offer tailored solutions for funds, family offices and investment teams.</p>
            <Button asChild className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-8">
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mb-24">
            <h2 className="text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex justify-between items-center px-6 py-4 text-left text-white font-medium hover:bg-zinc-800/30 transition-colors"
                  >
                    {faq.q}
                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-zinc-400 text-sm">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </>
  );
};

export default ServicesPage;
