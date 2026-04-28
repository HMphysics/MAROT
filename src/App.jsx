import React from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { StrategiesProvider } from '@/contexts/StrategiesContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import InvestmentStrategiesPage from '@/pages/InvestmentStrategiesPage';
import QuantStrategiesPage from '@/pages/QuantStrategiesPage';
import AboutUsPage from '@/pages/AboutUsPage';
import ResearchPage from '@/pages/ResearchPage';
import BlogPostPage from '@/pages/BlogPostPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import AccountPage from '@/pages/AccountPage';
import ServicesPage from '@/pages/ServicesPage';
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
          <meta property="og:site_name" content="Marot Strategies" />
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="en_US" />
          <meta property="og:image" content="https://marotstrategies.com/favicon.svg" />
          <meta property="og:url" content="https://marotstrategies.com/" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@marotstrategies" />
        </Helmet>
        
        <div className="bg-[#0b0c10] text-white min-h-screen font-sans antialiased">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/investment-strategies" element={<InvestmentStrategiesPage />} />
            <Route path="/quant-strategies" element={<QuantStrategiesPage />} />
            <Route path="/about-us" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Blog / Research */}
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/research/:slug" element={<BlogPostPage />} />

            {/* Auth-required routes */}
            <Route path="/account" element={<ProtectedRoute requireAuth><AccountPage /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute requireAuth requireAdmin><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/strategies" element={<ProtectedRoute requireAuth requireAdmin><StrategyManagementPage /></ProtectedRoute>} />
            <Route path="/admin/posts/new" element={<ProtectedRoute requireAuth requireAdmin><AdminPostEditorPage /></ProtectedRoute>} />
            <Route path="/admin/posts/:id/edit" element={<ProtectedRoute requireAuth requireAdmin><AdminPostEditorPage /></ProtectedRoute>} />
          </Routes>
          <Toaster />
        </div>
      </StrategiesProvider>
    </Router>
  );
}

export default App;
