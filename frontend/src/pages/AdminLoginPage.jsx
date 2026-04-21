import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

// Strictly allowed emails
const ALLOWED_EMAILS = [
  'cyclefundinvest@gmail.com',
  'finanzasbrais@gmail.com'
];

const AdminLoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const emailLower = email.toLowerCase().trim();

    // 1. Strict Email Allowlist Check
    if (!ALLOWED_EMAILS.includes(emailLower)) {
        toast({
            variant: "destructive",
            title: "Access Denied",
            description: "This email is not authorized for administrative access."
        });
        setLoading(false);
        return;
    }

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailLower,
          password
        });

        if (authError) throw authError;

        // Check/Provision admin_users table
        // Use maybeSingle() to avoid error if row doesn't exist yet
        const { data: adminData, error: fetchError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (fetchError) console.error("Error fetching admin profile:", fetchError);

        if (!adminData) {
           // Attempt to provision if missing (self-healing)
           // We use emailLower to ensure it matches the DB policy exactly
           const { error: insertError } = await supabase
              .from('admin_users')
              .insert({ id: authData.user.id, email: emailLower });
           
           if (insertError) {
               console.error("Provisioning error:", insertError);
               throw new Error("Account exists but admin privileges could not be verified (DB Policy).");
           }
        }

        toast({
          title: "Login successful",
          description: "Welcome back, Commander."
        });
        navigate('/admin/dashboard');

      } else {
        // --- REGISTRATION LOGIC ---
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: emailLower,
          password,
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
            // Attempt to grant admin privileges immediately
            // We use emailLower to ensure it matches the DB policy exactly
            const { error: insertError } = await supabase
                .from('admin_users')
                .insert({ id: signUpData.user.id, email: emailLower });
            
            if (insertError) {
                console.log("Admin provisioning note:", insertError.message);
                // If it fails here (e.g. email confirmation required), the Login flow's self-healing will catch it later.
            }

            toast({
                title: "Registration Successful",
                description: "Account created. You can now log in."
            });
            setIsLogin(true); // Switch back to login view
        } else {
             toast({
                title: "Check your email",
                description: "A confirmation link may have been sent."
            });
        }
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: isLogin ? "Login failed" : "Registration failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Restricted Access - MAROT STRATEGIES</title>
      </Helmet>
      <div className="bg-[#0b0c10] min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-900/50">
                <Lock className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white text-center mb-2">
                {isLogin ? 'Restricted Access' : 'Admin Registration'}
            </h1>
            <p className="text-gray-400 text-center mb-8 text-sm">
                Authorized personnel only. <br/> 
                Access is monitored and logged.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Identifier
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-700"
                  placeholder="admin@marot.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  {isLogin ? 'Passcode' : 'Set Password'}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-700"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                  <div className="p-3 bg-yellow-900/10 border border-yellow-900/30 rounded text-xs text-yellow-200 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                        Only authorized emails will be accepted. All other attempts are blocked.
                    </span>
                  </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black hover:bg-gray-200 py-6 rounded-lg font-bold transition-all mt-4"
              >
                {loading 
                    ? 'Processing...' 
                    : (isLogin ? 'Authenticate' : 'Create Account')
                }
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                <button 
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setEmail('');
                        setPassword('');
                    }}
                    className="text-gray-500 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                    {isLogin ? (
                        <>
                            <UserPlus className="w-4 h-4" /> Need to register?
                        </>
                    ) : (
                        <>
                            <LogIn className="w-4 h-4" /> Back to Login
                        </>
                    )}
                </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AdminLoginPage;