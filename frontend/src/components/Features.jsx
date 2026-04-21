import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Globe, GitCommit } from 'lucide-react';

const featuresData = [
  {
    icon: Zap,
    title: "Market Momentum",
    subtitle: "Capture Trends. Power Decisions.",
    description: "Dynamic market analysis to identify opportunities and strategically manage risks.",
  },
  {
    icon: Globe,
    title: "Macroeconomic Analysis",
    subtitle: "Global Vision. Local Decisions.",
    description: "Evaluation of key macroeconomic variables to anticipate shifts and optimize investment strategies.",
  },
  {
    icon: GitCommit,
    title: "Technical Analysis",
    subtitle: "Precision in Every Move.",
    description: "In-depth study of market patterns and data to execute tactical decisions with confidence.",
  },
];

const cardVariants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8,
    },
  },
};

const Features = () => {
  return (
    <section className="py-24 bg-[#0b0c10] relative">
      <div className="absolute inset-0 bg-contain bg-center opacity-[0.03]" style={{ backgroundImage: "url(https://horizons-cdn.hostinger.com/664ed942-0678-4791-80c7-f763dd4ec3fd/b3b3c5f04a581a6007fc533bc61a69c0.png)" }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-[#0b0c10]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuresData.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.5 }}
              variants={cardVariants}
              transition={{ delay: index * 0.2 }}
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-full backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-cyan-400/50 card-glow">
                <div className="mb-6">
                  <feature.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-lg font-semibold text-cyan-400 mb-4">{feature.subtitle}</p>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;