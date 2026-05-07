import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { User, LogOut, Shield, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

const tierLabels = { strategies: 'Marot Strategies', research: 'Marot Research', total: 'Marot Total' };
const statusLabels = { active: 'Active', inactive: 'Inactive', past_due: 'Past due', canceled: 'Canceled' };

const AccountPage = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const subActive = profile?.subscription_status === 'active' &&
    profile?.subscription_expires_at &&
    new Date(profile.subscription_expires_at) > new Date();

  return (
    <>
      <Helmet><title>My account - MAROT STRATEGIES</title></Helmet>
      <div className="min-h-screen bg-[#0b0c10] text-white">
        <Header />
        <main className="pt-32 pb-20 px-4 md:px-8 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-8">My account</h1>

            {/* Profile card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-cyan-900/30 rounded-full flex items-center justify-center border border-cyan-900/50">
                  <User className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{profile?.full_name || user?.email}</h2>
                  <p className="text-zinc-400 text-sm">{user?.email}</p>
                </div>
                {isAdmin && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold bg-red-900/30 text-red-400 border border-red-900/50 px-3 py-1 rounded-full">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
            </div>

            {/* Subscription card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
              <h3 className="text-sm uppercase tracking-wider text-zinc-500 font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Subscription
              </h3>
              {subActive ? (
                <div>
                  <p className="text-white font-semibold text-lg">{tierLabels[profile.subscription_tier] || profile.subscription_tier}</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    Status: <span className="text-emerald-400">{statusLabels[profile.subscription_status]}</span>
                  </p>
                  <p className="text-zinc-500 text-sm">
                    Expires on: {new Date(profile.subscription_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-zinc-400 mb-3">No active subscription.</p>
                  <Button asChild className="bg-cyan-600 hover:bg-cyan-500 text-white">
                    <Link to="/services">View plans</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Admin link */}
            {isAdmin && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  <Shield className="w-4 h-4" /> Admin dashboard
                </Link>
              </div>
            )}

            {/* Logout */}
            <Button onClick={handleLogout} variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2">
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default AccountPage;
