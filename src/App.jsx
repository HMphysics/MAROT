import React from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { StrategiesProvider } from '@/contexts/StrategiesContext';
import HomePage from '@/pages/HomePage';
import InvestmentStrategiesPage from '@/pages/InvestmentStrategiesPage';
import QuantStrategiesPage from '@/pages/QuantStrategiesPage';
import AboutUsPage from '@/pages/AboutUsPage';
import ResearchPage from '@/pages/ResearchPage';
import BlogPostPage from '@/pages/BlogPostPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminPostEditorPage from '@/pages/AdminPostEditorPage';
import StrategyManagementPage from '@/pages/StrategyManagementPage';
import ContactPage from '@/pages/ContactPage';

function App() {
  return (
    <Router>
      <StrategiesProvider>
        <Helmet defaultTitle="MAROT STRATEGIES" titleTemplate="%s | MAROT STRATEGIES">
          <html lang="en" />
          <meta charSet="utf-8" />
          <title>Capture Trends. Power Decisions.</title>
          <meta name="description" content="Dynamic market analysis to identify opportunities and strategically manage risks." />
          <meta name="theme-color" content="#0b0c10" />
          
          {/* Default Open Graph */}
          <meta property="og:site_name" content="Marot Strategies" />
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="en_US" />
          <meta property="og:image" content="https://marotstrategies.com/favicon.svg" />
          <meta property="og:url" content="https://marotstrategies.com/" />
          
          {/* Default Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@marotstrategies" />
        </Helmet>
        
        <div className="bg-[#0b0c10] text-white min-h-screen font-sans antialiased">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/investment-strategies" element={<InvestmentStrategiesPage />} />
            <Route path="/quant-strategies" element={<QuantStrategiesPage />} />
            <Route path="/about-us" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            {/* Blog Routes */}
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/research/:slug" element={<BlogPostPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/strategies" element={<StrategyManagementPage />} />
            <Route path="/admin/posts/new" element={<AdminPostEditorPage />} />
            <Route path="/admin/posts/:id/edit" element={<AdminPostEditorPage />} />
          </Routes>
          <Toaster />
        </div>
      </StrategiesProvider>
    </Router>
  );
}

export default App;