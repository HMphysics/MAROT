import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStrategies } from '@/hooks/useStrategies';
import { Loader2 } from 'lucide-react';

const StrategyNameEditor = ({ strategy, isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { updateStrategyName } = useStrategies();

  useEffect(() => {
    if (strategy) {
      setName(strategy.name);
    }
  }, [strategy]);

  const handleSave = async () => {
    if (!strategy) return;
    
    setIsSaving(true);
    const success = await updateStrategyName(strategy.id, name);
    setIsSaving(false);
    
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Strategy Name</DialogTitle>
          <DialogDescription className="text-gray-400">
            Make changes to the strategy name here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300">
              Strategy Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 flex h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="text-xs text-gray-500">
             Internal Key: <code className="bg-gray-800 px-1 py-0.5 rounded">{strategy?.key}</code>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="border-gray-700 hover:bg-gray-800 text-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()} className="bg-blue-600 hover:bg-blue-500 text-white">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StrategyNameEditor;