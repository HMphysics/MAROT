import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) setProfile(data);
      else setProfile(null);
    } catch {
      setProfile(null);
    }
  }, []);

  const handleSession = useCallback((currentSession) => {
    setSession(currentSession);
    const u = currentSession?.user ?? null;
    setUser(u);
    if (u) {
      fetchProfile(u.id);
    } else {
      setProfile(null);
    }
    setLoading(false);
    setInitializationError(null);
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) handleSession(initialSession);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setInitializationError(error);
          setLoading(false);
        }
        const isRefreshTokenError =
          error.message && (
            error.message.includes('refresh_token_not_found') ||
            error.message.includes('Invalid Refresh Token') ||
            error.message.includes('invalid_grant')
          );
        if (isRefreshTokenError) {
          await supabase.auth.signOut();
          if (mounted) handleSession(null);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (mounted) {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION', 'USER_UPDATED'].includes(event)) {
          handleSession(currentSession);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      toast({ variant: "destructive", title: "Sign-up failed", description: error.message });
      return { data: null, error };
    }
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      toast({ variant: "destructive", title: "Sign-in failed", description: error.message });
      return { data: null, error };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error) {
      toast({ variant: "destructive", title: "Sign-out failed", description: error.message });
      return { error };
    }
  }, [toast]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const isAdmin = profile?.role === 'admin';

  const hasActiveSubscription = useCallback((tier) => {
    if (!profile) return false;
    if (profile.subscription_status !== 'active') return false;
    if (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) <= new Date()) return false;
    if (profile.subscription_tier === 'total') return true;
    return profile.subscription_tier === tier;
  }, [profile]);

  const value = useMemo(() => ({
    user, session, profile, loading, initializationError,
    isAdmin, hasActiveSubscription, refreshProfile,
    signUp, signIn, signOut,
  }), [user, session, profile, loading, initializationError, isAdmin, hasActiveSubscription, refreshProfile, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
