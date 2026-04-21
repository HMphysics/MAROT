import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import Header from '@/components/Header';
import NewsletterForm from '@/components/NewsletterForm';
import { ArrowLeft, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      
      if (!error) setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-white">Loading...</div>;
  if (!post) return <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-white">Post not found</div>;

  // Determine how to render content
  // New format: content is object { html: '...', json: ... }
  // Old format: content is array of blocks
  const renderContent = () => {
    const { content } = post;

    // New HTML Format (TipTap)
    if (content && typeof content === 'object' && content.html) {
        return (
            <div 
                className="prose prose-invert max-w-none prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-p:text-gray-300 prose-p:font-serif prose-p:leading-relaxed prose-li:text-gray-300 prose-img:rounded-xl prose-img:shadow-2xl prose-a:text-blue-400 prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400 prose-blockquote:italic [&>h1]:text-5xl [&>h1]:font-bold [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:leading-tight [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-6 [&>h2]:leading-snug [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:mb-3 [&>h3]:mt-4"
                dangerouslySetInnerHTML={{ __html: content.html }}
            />
        );
    }
    
    // Legacy Block Format (Fallback)
    if (Array.isArray(content)) {
        return (
            <div className="prose prose-invert max-w-none prose-lg">
                {content.map((block) => {
                    switch (block.type) {
                        case 'heading':
                            const Tag = `h${block.level || 2}`;
                            // Apply exact same classes as BlogEditor for consistency
                            const headingClasses = {
                                1: "text-5xl font-bold mb-6 mt-8 leading-tight",
                                2: "text-3xl font-bold mb-4 mt-6 leading-snug",
                                3: "text-2xl font-semibold mb-3 mt-4"
                            };
                            return <Tag key={block.id} className={cn("text-white", headingClasses[block.level || 2] || headingClasses[2])}>{block.value}</Tag>;
                        case 'paragraph':
                            return (
                                <p key={block.id} className="text-gray-300 font-serif leading-relaxed mb-6">
                                    <MarkdownRenderer content={block.value} />
                                </p>
                            );
                        case 'list':
                            return (
                                <ul key={block.id} className="list-disc pl-5 mb-4">
                                    <li className="text-gray-300 font-serif"><MarkdownRenderer content={block.value} /></li>
                                </ul>
                            );
                        case 'quote':
                            return (
                                <blockquote key={block.id} className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-8">
                                    <MarkdownRenderer content={block.value} />
                                </blockquote>
                            );
                        case 'image':
                            return (
                                <figure key={block.id} className="my-10">
                                    <img src={block.value} alt="Article visual" className="rounded-xl shadow-2xl w-full" />
                                </figure>
                            );
                        default: return null;
                    }
                })}
            </div>
        );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      <Helmet>
        <title>{post.title} - MAROT Research</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>

      <Header />

      <main className="pt-32 pb-20 px-4 md:px-8">
        <article className="max-w-3xl mx-auto">
          <Link to="/research" className="inline-flex items-center text-gray-500 hover:text-white mb-10 transition-colors text-sm font-medium uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Research
          </Link>

          <div className="mb-6">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/30 px-3 py-1 rounded-full bg-blue-500/10">
              {post.category}
            </span>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-8 leading-[1.1] tracking-tight"
          >
            {post.title}
          </motion.h1>

          {post.excerpt && (
            <p className="text-xl md:text-2xl text-gray-400 mb-8 font-serif leading-relaxed font-light">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between text-gray-500 text-sm border-y border-gray-800 py-6 mb-12">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(post.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {/* Can add author here later */}
          </div>

          {post.cover_image && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-16 -mx-4 md:-mx-8 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl"
            >
              <img src={post.cover_image} alt={post.title} className="w-full h-auto" />
            </motion.div>
          )}

          {renderContent()}

          <div className="mt-20 pt-10 border-t border-gray-800">
            <h3 className="text-2xl font-bold mb-6 text-center">Subscribe to our research</h3>
            <NewsletterForm />
          </div>
        </article>
      </main>
    </div>
  );
};

export default BlogPostPage;