import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import { ChevronDown, User, LayoutDashboard, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/SupabaseAuthContext';
// MarotLogo import removed as per task
import MobileMenu from '@/components/MobileMenu';

const NavLink = ({ to, children }) => {
  const { toast } = useToast();
  const isExternalOrPlaceholder = !to || to.startsWith('http');

  if (isExternalOrPlaceholder) {
    return (
      <button
        onClick={() => toast({ description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀" })}
        className="text-sm font-medium text-gray-300 hover:text-white transition-colors uppercase"
      >
        {children}
      </button>
    );
  }

  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        `text-sm font-medium transition-colors uppercase ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`
      }
    >
      {children}
    </RouterNavLink>
  );
};

const Header = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-30 py-6 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto flex justify-between items-center"
        >
          {/* Company Name as plain text */}
          <Link to="/" className="flex items-center gap-4 relative z-40 group">
            <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-widest leading-none">
              MAROT STRATEGIES
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/about-us">ABOUT US</NavLink>
            <NavLink to="/quant-strategies">QUANT STRATEGIES</NavLink>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors focus:outline-none uppercase">
                RESEARCH <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
                <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-white cursor-pointer">
                  <Link to="/research?category=White Papers" className="w-full">White Papers</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-white cursor-pointer">
                  <Link to="/research?category=Market Analysis" className="w-full">Market Analysis</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink to="/contact">CONTACT US</NavLink>
            <div className="border-l border-gray-600 h-6"></div>
            
            {user ? (
              <Link to="/admin/dashboard" title="Admin Dashboard">
                <LayoutDashboard className="w-5 h-5 text-blue-400 hover:text-blue-300 transition-colors" />
              </Link>
            ) : (
              <Link to="/admin/login" title="Login">
                <User className="w-5 h-5 text-gray-300 hover:text-white transition-colors" />
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden z-40">
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gray-300 hover:text-white hover:bg-white/10"
             >
                <Menu className="w-6 h-6" />
             </Button>
          </div>

        </motion.div>
      </header>
      
      {/* Mobile Menu Slide-out */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};

export default Header;