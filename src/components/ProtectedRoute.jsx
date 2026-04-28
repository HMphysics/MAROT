import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PaywallScreen = ({ tier }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6 border border-zinc-700">
      <Lock className="w-10 h-10 text-zinc-500" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-3">Contenido exclusivo para suscriptores</h2>
    <p className="text-zinc-400 max-w-md mb-6">
      Indicadores cuantitativos propietarios en tiempo real. Acceso exclusivo para suscriptores.
    </p>
    <Button asChild className="bg-cyan-600 hover:bg-cyan-500 text-white px-8">
      <Link to="/services">Ver planes</Link>
    </Button>
  </div>
);

const ProtectedRoute = ({ children, requireAuth, requireAdmin, requireSubscription, showPaywall }) => {
  const { user, loading, profile, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireSubscription && user) {
    const hasAccess = profile &&
      profile.subscription_status === 'active' &&
      profile.subscription_expires_at &&
      new Date(profile.subscription_expires_at) > new Date() &&
      (profile.subscription_tier === 'total' || profile.subscription_tier === requireSubscription);

    if (!hasAccess) {
      if (showPaywall) return <PaywallScreen tier={requireSubscription} />;
      return <Navigate to="/services" replace />;
    }
  }

  if (requireSubscription && !user) {
    if (showPaywall) return <PaywallScreen tier={requireSubscription} />;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
