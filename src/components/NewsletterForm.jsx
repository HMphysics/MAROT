import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert({ email });

      if (error) {
        if (error.code === '23505') { // Unique violation
            toast({
                title: "Already subscribed",
                description: "This email is already on our list.",
            });
            setSubscribed(true);
        } else {
            throw error;
        }
      } else {
        setSubscribed(true);
        toast({
          title: "Subscribed!",
          description: "Thank you for subscribing to our research updates.",
        });
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      let errorMessage = "Something went wrong. Please try again.";
      if (error.message === 'Failed to fetch' || error.status === 0) {
        errorMessage = "Network error. Please check your connection.";
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-900/20 border border-green-800 rounded-xl p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">You're Subscribed!</h3>
        <p className="text-gray-400">Get ready for top-tier market analysis delivered to your inbox.</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold text-white">Subscribe to Research</h3>
      </div>
      <p className="text-gray-400 mb-6">
        Join our exclusive list to receive the latest White Papers, Case Studies, and Market Analysis directly.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
        <Button 
            type="submit" 
            disabled={loading}
            className="bg-white text-black hover:bg-gray-200"
        >
          {loading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
    </div>
  );
};

export default NewsletterForm;