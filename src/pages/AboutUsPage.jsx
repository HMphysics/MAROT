import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';

const Section = ({ children, className = '' }) => (
  <motion.section
    className={`py-16 ${className}`}
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.8 }}
  >
    {children}
  </motion.section>
);

const AboutUsPage = () => {
  const focusItems = [
    {
      title: "Trend Research & Market Dynamics",
      subtitle: "Anticipate Trends. Lead the Market.",
      description: "We analyze global market trends to identify emerging patterns and position investments ahead of market shifts."
    },
    {
      title: "Macro-Strategic Positioning",
      subtitle: "Global Vision. Strategic Impact.",
      description: "Our macroeconomic research guides strategic positioning to capitalize on global economic shifts and sectoral trends."
    },
    {
      title: "Uncorrelated Investment Strategies",
      subtitle: "Diversify Intelligently. Reduce Risk.",
      description: "We design uncorrelated strategies that balance risk and enhance portfolio resilience across market cycles."
    },
    {
      title: "Advanced Trading Systems",
      subtitle: "Technology-Driven. Performance-Focused.",
      description: "We develop and implement algorithmic trading systems for precision, speed, and consistency in market execution."
    },
    {
      title: "Options & Growth Stocks",
      subtitle: "Agility in Options. Vision in Growth.",
      description: "We leverage options strategies and identify high-potential growth stocks to capture dynamic market opportunities."
    }
  ];

  return (
    <>
      <Helmet>
        <title>About Us - MAROT STRATEGIES</title>
        <meta name="description" content="Learn about Marot Strategies, our mission, and our approach to financial research." />
        <meta property="og:title" content="About Us - MAROT STRATEGIES" />
        <meta property="og:description" content="Strategic Vision. Informed Decisions. Sustainable Growth." />
        <meta property="og:url" content="https://marotstrategies.com/about-us" />
      </Helmet>
      <div className="bg-[#0b0c10] min-h-screen text-gray-300 font-sans">
        <Header />
        <main className="pt-32 pb-16 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            
            <Section className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">About Marot Strategies</h1>
              <p className="mt-4 text-lg md:text-xl text-gray-400">Strategic Vision. Informed Decisions. Sustainable Growth.</p>
              <p className="mt-8 max-w-3xl mx-auto text-base md:text-lg">
                We are a financial research firm dedicated to delivering comprehensive and innovative investment solutions. Our expertise spans across trend research, macro-strategic positioning, uncorrelated investment strategies, advanced trading systems, options strategies, and growth stock analysis. We provide the insights and strategies that empower our clients to navigate complex markets and achieve sustainable success.
              </p>
            </Section>

            <div className="border-t border-gray-800 my-12"></div>

            <Section>
              <h2 className="text-4xl font-bold text-white text-center mb-12">Our Focus</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {focusItems.map((item, index) => (
                  <div key={index} className="flex flex-col items-center text-center md:items-start md:text-left gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-gray-400">{item.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 mt-2">{item.description}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section className="text-center mt-12">
              <h2 className="text-4xl font-bold text-white mb-8">Our Commitment</h2>
              <div className="flex flex-col items-center max-w-3xl mx-auto gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Actionable Insights. Tailored Strategies.</h3>
                </div>
                <p className="text-gray-400 mt-2 text-base md:text-lg">
                  At the core of our work is a commitment to providing actionable insights and tailored strategies. We combine in-depth research with innovative financial solutions to optimize portfolios, mitigate risks, and unlock growth opportunities. Our multidimensional approach allows us to stay ahead in a constantly evolving market, helping our clients make confident and informed decisions.
                </p>
              </div>
            </Section>

          </div>
        </main>
      </div>
    </>
  );
};

export default AboutUsPage;