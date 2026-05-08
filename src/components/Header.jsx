import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import { ChevronDown, User, LayoutDashboard, Menu, LogOut, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MobileMenu from '@/components/MobileMenu';

const NavLink = ({ to, children }) => {
  const { toast } = useToast();
  const isExternalOrPlaceholder = !to || to.startsWith('http');

  if (isExternalOrPlaceholder) {
    return (
      <button
        onClick={() => toast({ description: "This feature isn't implemented yet." })}
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
  const { user, isAdmin, signOut, profile } = useAuth();
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
                <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-white cursor-pointer">
                  <Link to="/research?category=Educational Primers" className="w-full">Educational Primers</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-white cursor-pointer">
                  <Link to="/research?category=Terminal" className="w-full">Terminal</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink to="/services">SERVICES</NavLink>
            <NavLink to="/contact">CONTACT US</NavLink>
            <div className="border-l border-gray-600 h-6"></div>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                  <div className="w-8 h-8 bg-cyan-900/40 rounded-full flex items-center justify-center border border-cyan-800/50">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-sm text-zinc-300 max-w-[120px] truncate hidden lg:inline">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white w-48">
                  <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-white cursor-pointer">
                    <Link to="/account" className="w-full flex items-center gap-2">
                      <UserCircle className="w-4 h-4" /> My account
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-white cursor-pointer">
                      <Link to="/admin/dashboard" className="w-full flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem onClick={() => signOut()} className="focus:bg-gray-800 focus:text-white cursor-pointer flex items-center gap-2 text-red-400">
                    <LogOut className="w-4 h-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm text-zinc-300 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link to="/signup" className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium">
                  Sign up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile */}
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
      
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};

export default Header;
