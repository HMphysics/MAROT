import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { X, ChevronDown, ChevronRight, User, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import MarotLogo from '@/components/MarotLogo';

const MobileMenu = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth(); // Assuming signOut is available, if not we use supabase directly
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isResearchOpen, setIsResearchOpen] = useState(true);

  // Helper for links that might not be implemented
  const handleLinkClick = (to) => {
    if (!to || to.startsWith('http')) {
      toast({ description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀" });
    } else {
      onClose();
    }
  };

  const menuVariants = {
    closed: { x: "100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  const backdropVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Menu Sidebar */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-[#0b0c10] border-l border-gray-800 z-50 flex flex-col md:hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div onClick={onClose}>
                <MarotLogo className="h-10 w-auto" />
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
              
              {/* Main Navigation */}
              <nav className="flex flex-col space-y-4">
                <Link 
                  to="/" 
                  onClick={() => handleLinkClick('/')}
                  className="text-lg font-medium text-gray-200 hover:text-blue-400 transition-colors uppercase"
                >
                  Home
                </Link>
                
                <Link 
                  to="/about-us" 
                  onClick={() => handleLinkClick('/about-us')}
                  className="text-lg font-medium text-gray-200 hover:text-blue-400 transition-colors uppercase"
                >
                  About Us
                </Link>
                
                <Link 
                  to="/quant-strategies" 
                  onClick={() => handleLinkClick('/quant-strategies')}
                  className="text-lg font-medium text-gray-200 hover:text-blue-400 transition-colors uppercase"
                >
                  Quant Strategies
                </Link>

                {/* Research Accordion */}
                <div className="border-t border-gray-800/50 pt-4">
                  <button 
                    onClick={() => setIsResearchOpen(!isResearchOpen)}
                    className="flex items-center justify-between w-full text-lg font-medium text-gray-200 hover:text-blue-400 transition-colors uppercase mb-3"
                  >
                    Research
                    {isResearchOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  
                  <AnimatePresence>
                    {isResearchOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col space-y-3 pl-4 border-l border-gray-800 ml-1">
                          <Link 
                            to="/research?category=White Papers"
                            onClick={() => handleLinkClick('/research?category=White Papers')}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                          >
                            White Papers
                          </Link>
                          <Link 
                            to="/research?category=Market Analysis"
                            onClick={() => handleLinkClick('/research?category=Market Analysis')}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                          >
                            Market Analysis
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link 
                  to="/contact" 
                  onClick={() => handleLinkClick('/contact')}
                  className="text-lg font-medium text-gray-200 hover:text-blue-400 transition-colors uppercase border-t border-gray-800/50 pt-4"
                >
                  Contact Us
                </Link>
              </nav>
            </div>

            {/* Footer / User Section */}
            <div className="p-6 border-t border-gray-800 bg-gray-900/30">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800/50">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Logged In</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>
                    </div>
                  </div>
                  
                  <Link 
                    to="/admin/dashboard" 
                    onClick={() => handleLinkClick('/admin/dashboard')}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </div>
              ) : (
                <Link 
                  to="/admin/login" 
                  onClick={() => handleLinkClick('/admin/login')}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-md text-sm font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  Admin Login
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;