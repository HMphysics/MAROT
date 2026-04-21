import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Header from '@/components/Header';
import FounderCard from '@/components/FounderCard';
import ContactForm from '@/components/ContactForm';

const ContactPage = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us - MAROT STRATEGIES</title>
        <meta name="description" content="Contact Marot Strategies for inquiries about our investment strategies and research services." />
        <meta property="og:title" content="Contact Us - MAROT STRATEGIES" />
        <meta property="og:description" content="Get in touch with our team of managing directors." />
        <meta property="og:url" content="https://marotstrategies.com/contact" />
      </Helmet>
      
      <div className="bg-[#0b0c10] min-h-screen text-white font-sans selection:bg-gray-700 selection:text-white">
        <Header />
        
        <main className="pt-32 pb-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Hero Section */}
            <div className="text-center mb-16 space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              >
                Contact Us
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-gray-400 max-w-2xl mx-auto"
              >
                We are here to answer your questions and discuss how our strategies can align with your investment goals.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              
              {/* Left Column: Information */}
              <div className="space-y-10">
                
                {/* Founders Section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-semibold border-l-4 border-blue-500 pl-4">Our Team</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <FounderCard 
                      name="Cristian Correa Arango" 
                      title="Founder & Managing Director" 
                    />
                    <FounderCard 
                      name="Brais Prieto Otero" 
                      title="Founder & Managing Director" 
                    />
                  </div>
                </motion.div>

                {/* Contact Details */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-gray-900/30 border border-gray-800 rounded-xl p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-blue-900/20 p-2 rounded-lg border border-blue-800/30">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Email Us</h3>
                      <p className="text-gray-400 mb-2 text-sm">For general inquiries and information:</p>
                      <a 
                        href="mailto:info@marotstrategies.com" 
                        className="text-xl font-medium text-white hover:text-blue-400 transition-colors"
                      >
                        info@marotstrategies.com
                      </a>
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* Right Column: Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 md:p-8">
                  <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>
                  <ContactForm />
                </div>
              </motion.div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ContactPage;