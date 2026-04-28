import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const intent = searchParams.get('intent');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signUp(email.toLowerCase().trim(), password, {
      data: { full_name: fullName },
    });
    setLoading(false);

    if (!error && data?.user) {
      if (data.user.identities?.length === 0) {
        toast({ variant: 'destructive', title: 'Este email ya está registrado', description: 'Inicia sesión en su lugar.' });
        return;
      }
      toast({ title: 'Cuenta creada', description: 'Ya puedes iniciar sesión.' });
      navigate(intent ? `/login` : '/login');
    }
  };

  return (
    <>
      <Helmet><title>Registrarse - MAROT STRATEGIES</title></Helmet>
      <div className="bg-[#0b0c10] min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-cyan-900/20 rounded-full flex items-center justify-center border border-cyan-900/50">
                <UserPlus className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">Crear cuenta</h1>
            <p className="text-zinc-400 text-center mb-8 text-sm">Únete a Marot Strategies</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre completo</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="Tu nombre" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="tu@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="Mínimo 6 caracteres" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-6 rounded-lg font-bold">
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
              <Link to="/login" className="text-zinc-500 hover:text-white text-sm transition-colors">
                ¿Ya tienes cuenta? <span className="text-cyan-400">Inicia sesión</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SignupPage;
