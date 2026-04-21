import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const StrategiesContext = createContext();

export const StrategiesProvider = ({ children }) => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchStrategies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('strategies')
        .select('*')
        .order('name');
      
      if (fetchError) throw fetchError;
      setStrategies(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching strategies:', err);
      setError(err.message || "Failed to load strategies");
      // Keep previous strategies if available, or empty array
      if (strategies.length === 0) setStrategies([]);
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not load strategies. Please check your internet connection.",
      });
    } finally {
      setLoading(false);
    }
  }, []); // Removed strategies dependency to avoid infinite loop if we used it

  const updateStrategyName = async (id, newName) => {
    try {
      const { error: updateError } = await supabase
        .from('strategies')
        .update({ name: newName })
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Optimistic update
      setStrategies(prev => prev.map(s => 
        s.id === id ? { ...s, name: newName } : s
      ));

      toast({
        title: "Success",
        description: "Strategy name updated successfully.",
        className: "bg-green-900 border-green-800 text-white"
      });
      return true;
    } catch (err) {
      console.error('Error updating strategy:', err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Failed to update strategy name."
      });
      return false;
    }
  };

  useEffect(() => {
    fetchStrategies();

    // Real-time subscription
    const channel = supabase
      .channel('strategies-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'strategies' }, 
        (payload) => {
          if (payload.eventType === 'UPDATE') {
             setStrategies(prev => prev.map(s => 
               s.id === payload.new.id ? payload.new : s
             ));
          } else if (payload.eventType === 'INSERT') {
             setStrategies(prev => [...prev, payload.new]);
          } else {
             fetchStrategies(); // Fallback for other events
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('Subscribed to strategies changes');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error for strategies');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStrategies]);

  return (
    <StrategiesContext.Provider value={{ 
      strategies, 
      loading, 
      error, 
      updateStrategyName, 
      refreshStrategies: fetchStrategies,
      retry: fetchStrategies 
    }}>
      {children}
    </StrategiesContext.Provider>
  );
};