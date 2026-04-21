import React, { useState } from 'react';
import { Upload, X, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const CoverImageUpload = ({ value, onChange }) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload an image file.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `blog-covers/${fileName}`;

      // Ensure 'images' bucket exists in Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      onChange(data.publicUrl);
      toast({ title: "Success", description: "Cover image uploaded successfully." });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Could not upload image. Try using a URL instead.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      onChange(urlInput);
      setShowUrlInput(false);
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Cover Image</label>
      
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-700 bg-gray-900 aspect-video md:aspect-[2/1]">
          <img 
            src={value} 
            alt="Cover" 
            className="w-full h-full object-cover transition-opacity group-hover:opacity-75" 
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onChange('')}
              className="gap-2"
            >
              <X className="w-4 h-4" /> Remove Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
          {!showUrlInput ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-gray-800 text-gray-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-300">Upload a cover image</p>
                <p className="text-xs text-gray-500">Recommended size: 1200x630px</p>
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Button variant="outline" size="sm" className="relative overflow-hidden border-gray-600 hover:bg-gray-800 text-gray-300">
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Choose File'}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      disabled={isUploading}
                    />
                  </Button>
                </div>
                <span className="text-gray-600 flex items-center text-sm">or</span>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowUrlInput(true)}
                    className="text-gray-400 hover:text-white"
                >
                    <LinkIcon className="w-4 h-4 mr-2" /> Paste URL
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-md mx-auto">
                <div className="flex gap-2">
                    <Input 
                        placeholder="https://example.com/image.jpg"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="bg-gray-950 border-gray-700 text-white placeholder:text-gray-600"
                    />
                    <Button onClick={handleUrlSubmit} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                        Add
                    </Button>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowUrlInput(false)} 
                    className="self-center text-gray-500 hover:text-gray-300"
                >
                    Cancel
                </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoverImageUpload;