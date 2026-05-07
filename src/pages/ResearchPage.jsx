import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { ArrowRight, FileText, BarChart, BookOpen, Clock, Lock, Terminal } from 'lucide-react';
import Header from '@/components/Header';
import NewsletterForm from '@/components/NewsletterForm';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';

const categories = [
  { id: 'all', label: 'All Research' },
  { id: 'White Papers', label: 'White Papers' },
  { id: 'Market Analysis', label: 'Market Analysis' },
  { id: 'Terminal', label: 'Terminal' },
];

const ResearchPage = () => {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const { user, hasActiveSubscription } = useAuth();

  // Parse URL parameters to set initial category
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      const isValid = categories.some(c => c.id === categoryParam);
      if (isValid) setSelectedCategory(categoryParam);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;
    if (!error) {
      setPosts(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      <Helmet>
        <title>Research & Insights - MAROT STRATEGIES</title>
        <meta name="description" content="Deep dives into market trends, white papers, and market analysis by Marot Strategies." />
        <meta property="og:title" content="Research & Insights - MAROT STRATEGIES" />
        <meta property="og:description" content="Access our latest white papers, market analysis, and investment insights." />
        <meta property="og:url" content="https://marotstrategies.com/research" />
      </Helmet>

      <Header />

      <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Market Research
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Actionable intelligence and strategic analysis to power your investment decisions.
          </p>
        </motion.div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-2 rounded-full border transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-500 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Terminal section */}
        {selectedCategory === 'Terminal' ? (
          <div className="mb-20">
            {user && hasActiveSubscription('research') ? (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center">
                <Terminal className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Quantitative terminal</h2>
                <p className="text-zinc-400 text-lg">Coming soon: proprietary indicators in real time</p>
              </div>
            ) : (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center">
                <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-700">
                  <Lock className="w-10 h-10 text-zinc-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Subscribers-only content</h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-6">
                  Proprietary quantitative indicators in real time. Exclusive access for Marot Research or Marot Total subscribers.
                </p>
                <Button asChild className="bg-cyan-600 hover:bg-cyan-500 text-white px-8">
                  <Link to="/services">View plans</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
        <>
        {/* Featured / Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-900 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {posts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors"
              >
                <Link to={`/research/${post.slug}`} className="block h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 text-xs font-bold bg-black/70 backdrop-blur-md text-white rounded-full uppercase tracking-wider">
                            {post.category}
                        </span>
                    </div>
                    {post.cover_image ? (
                      <img 
                        src={post.cover_image} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <BarChart className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                        <Clock className="w-4 h-4" />
                        {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-400 line-clamp-3 mb-6 flex-grow">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
                      Read Article <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
            
            {posts.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-500">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No articles found in this category.</p>
                </div>
            )}
          </div>
        )}
        </>
        )}

        {/* Newsletter Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <NewsletterForm />
        </div>

      </main>
    </div>
  );
};

export default ResearchPage;