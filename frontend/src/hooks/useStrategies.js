import { useContext } from 'react';
import { StrategiesContext } from '@/contexts/StrategiesContext';

export const useStrategies = () => {
  const context = useContext(StrategiesContext);
  
  if (context === undefined) {
    throw new Error('useStrategies must be used within a StrategiesProvider');
  }
  
  return context;
};