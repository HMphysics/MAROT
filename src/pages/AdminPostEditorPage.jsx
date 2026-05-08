import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Eye, LayoutTemplate, Clock } from 'lucide-react';
import BlogEditor from '@/components/BlogEditor';
import CoverImageUpload from '@/components/CoverImageUpload';
import ArticlePreview from '@/components/ArticlePreview';

const AdminPostEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id || id === 'new';
  const saveIntervalRef = useRef(null);
  const lastSavedData = useRef(null);

  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Market Analysis',
    excerpt: '',
    cover_image: '',
    published: false,
    content: { html: '', json: {} }
  });

  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  useEffect(() => {
    if (!isNew) {
      fetchPost();
    }
  }, [id]);

  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      if (isDirty()) {
        handleSave(true);
      }
    }, 30000);

    return () => clearInterval(saveIntervalRef.current);
  }, [formData]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load post" });
      navigate('/admin/dashboard');
    } else {
      setFormData(data);
      lastSavedData.current = data;
    }
  };

  const isDirty = () => {
    if (!lastSavedData.current) return true;
    return JSON.stringify(formData) !== JSON.stringify(lastSavedData.current);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const ensureUniqueSlug = async (baseSlug, currentId = null) => {
    let uniqueSlug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      // Check if slug exists
      let query = supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', uniqueSlug);

      // If we are editing an existing post, exclude it from the check
      if (currentId) {
        query = query.neq('id', currentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error checking slug uniqueness:", error);
        // If error, assume unique to avoid infinite loop, but save might fail
        return uniqueSlug; 
      }

      if (data && data.length > 0) {
        // Slug exists, append counter
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        isUnique = true;
      }
    }
    return uniqueSlug;
  };

  const handleSave = async (auto = false) => {
    if (!formData.title && !auto) {
        toast({ variant: "destructive", title: "Missing Info", description: "Title is required." });
        return;
    }
    if (!formData.title) return;

    if (!auto) setLoading(true);
    
    // 1. Generate base slug from title if empty
    let baseSlug = formData.slug;
    if (!baseSlug && formData.title) {
        baseSlug = generateSlug(formData.title);
    } else if (baseSlug) {
        // Ensure manually entered slug is also URL friendly
        baseSlug = generateSlug(baseSlug);
    }

    // 2. Ensure uniqueness
    const uniqueSlug = await ensureUniqueSlug(baseSlug, isNew ? null : id);
    
    // Update state with the unique slug so the UI reflects it
    if (uniqueSlug !== formData.slug) {
        setFormData(prev => ({ ...prev, slug: uniqueSlug }));
    }

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...formData,
      slug: uniqueSlug,
      author_id: user?.id,
      updated_at: new Date().toISOString()
    };

    let error, data;
    if (isNew && !id) {
       const { data: newData, error: insertError } = await supabase.from('blog_posts').insert(payload).select().single();
      error = insertError;
      data = newData;
    } else {
      if (isNew && !data) {
         // This case handles if we switched from "new" to "saved" but ID wasn't in URL yet
         const { data: newData, error: insertError } = await supabase.from('blog_posts').insert(payload).select().single();
         error = insertError;
         if (newData) {
             navigate(`/admin/posts/${newData.id}`, { replace: true });
             lastSavedData.current = newData;
         }
      } else {
         const { error: updateError } = await supabase.from('blog_posts').update(payload).eq('id', id);
         error = updateError;
      }
    }

    if (!auto) setLoading(false);

    if (error) {
      if (!auto) {
          // Check for unique constraint violation specifically
          if (error.code === '23505') {
              toast({ variant: "destructive", title: "Slug Conflict", description: "This slug is already in use. A unique one was attempted but failed. Please try changing the title or slug manually." });
          } else {
              toast({ variant: "destructive", title: "Error saving", description: error.message });
          }
      }
      console.error("Save error:", error);
    } else {
      setLastSaved(new Date());
      lastSavedData.current = { ...formData, slug: uniqueSlug }; // Update reference with saved slug
      if (!auto) toast({ title: "Saved!", description: "Article has been saved successfully." });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white flex flex-col h-screen overflow-hidden">
      <Helmet><title>{formData.title || 'Untitled'} - Editor</title></Helmet>
      
      <div className="border-b border-gray-800 bg-gray-900 flex-shrink-0 z-50">
        <div className="w-full px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/dashboard')} className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
                </Button>
                <div className="h-6 w-px bg-gray-700"></div>
                {lastSaved && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Saved {lastSaved.toLocaleTimeString()}
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-3">
                 <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    className={isPreviewVisible ? "text-blue-400 bg-blue-400/10" : "text-gray-400"}
                 >
                    <LayoutTemplate className="w-4 h-4 mr-2" /> {isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
                 </Button>
                 
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-950 rounded border border-gray-800">
                    <input 
                        type="checkbox" 
                        id="publish-check"
                        checked={formData.published} 
                        onChange={(e) => setFormData({...formData, published: e.target.checked})}
                        className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-offset-0 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="publish-check" className="text-sm text-gray-300 cursor-pointer font-medium select-none">
                        Published
                    </label>
                </div>

                <Button onClick={() => handleSave(false)} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
                    <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-12 transition-all duration-300 ${isPreviewVisible ? 'max-w-[50%] border-r border-gray-800' : 'max-w-full mx-auto w-full'}`}>
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                <input
                    type="text"
                    placeholder="Article Title"
                    value={formData.title}
                    onChange={(e) => {
                        const title = e.target.value;
                        // Only auto-generate slug if it's a new post and user hasn't manually edited the slug yet (or slug matches old title)
                        // For simplicity, we'll just update slug if it's new.
                        setFormData(prev => ({
                             ...prev, 
                             title, 
                             slug: isNew && (!prev.slug || prev.slug === generateSlug(prev.title)) ? generateSlug(title) : prev.slug 
                        }));
                    }}
                    className="w-full bg-transparent text-4xl md:text-5xl font-bold border-none focus:ring-0 placeholder:text-gray-700 px-0 leading-tight"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-900/50 rounded-xl border border-gray-800/50">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Excerpt</label>
                            <textarea
                                value={formData.excerpt}
                                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                                placeholder="Short description for SEO and preview cards..."
                                rows={3}
                                className="w-full bg-gray-950 border-gray-800 rounded-lg text-sm p-3 text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full bg-gray-950 border-gray-800 rounded-lg text-sm h-10 px-2 text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="Market Analysis">Market Analysis</option>
                                    <option value="White Papers">White Papers</option>
                                    <option value="Educational Primers">Educational Primers</option>
                                    <option value="Case Studies">Case Studies</option>
                                    <option value="Strategy Updates">Strategy Updates</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Slug</label>
                                <Input 
                                    value={formData.slug} 
                                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                    className="h-10 bg-gray-950 border-gray-800 font-mono text-xs"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <CoverImageUpload 
                            value={formData.cover_image} 
                            onChange={(url) => setFormData({...formData, cover_image: url})} 
                        />
                    </div>
                </div>

                <div className="min-h-[600px]">
                    <BlogEditor 
                        content={formData.content} 
                        onChange={(newContent) => setFormData({ ...formData, content: newContent })} 
                        className="min-h-[600px]"
                    />
                </div>
            </div>
        </div>

        {isPreviewVisible && (
            <div className="flex-1 bg-black p-6 md:p-8 lg:p-12 hidden lg:block overflow-hidden">
                 <div className="h-full max-w-7xl mx-auto">
                    <ArticlePreview 
                        title={formData.title}
                        category={formData.category}
                        excerpt={formData.excerpt}
                        coverImage={formData.cover_image}
                        content={formData.content}
                        date={formData.created_at}
                    />
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminPostEditorPage;