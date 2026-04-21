import React from 'react';
import { motion } from 'framer-motion';
import ParticleBackground from '@/components/ParticleBackground';
import Header from '@/components/Header';

const Hero = () => {
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0b0c10]">
      {/* Animated Canvas Background */}
      <ParticleBackground />
      
      {/* Dark Gradient Overlay for Readability */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(11, 12, 16, 0.4) 0%, rgba(11, 12, 16, 0.8) 100%)'
        }}
      />

      <Header />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-6xl md:text-8xl font-bold mb-6 tracking-tight text-white drop-shadow-lg"
        >
          Capture Trends. Power Decisions<span className="text-cyan-400">.</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto drop-shadow-md"
        >
          Dynamic market analysis to identify opportunities and strategically manage risks
        </motion.p>
      </div>
    </div>
  );
};

export default Hero;