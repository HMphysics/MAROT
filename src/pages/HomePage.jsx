import React from 'react';
import { Helmet } from 'react-helmet';
import Hero from '@/components/Hero';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Home - MAROT STRATEGIES</title>
        <meta name="description" content="Capture Trends. Power Decisions. Marot Strategies provides advanced quantitative investment models and market research to help you navigate global markets." />
        <meta property="og:title" content="Home - MAROT STRATEGIES" />
        <meta property="og:description" content="Capture Trends. Power Decisions. Advanced quantitative investment models and market research." />
        <meta property="og:url" content="https://marotstrategies.com/" />
        <link rel="canonical" href="https://marotstrategies.com/" />
      </Helmet>
      <Hero />
    </div>
  );
};

export default HomePage;