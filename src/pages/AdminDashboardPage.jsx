import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, LogOut, Eye, Users, FileText, BarChart3, Settings2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useStrategies } from '@/hooks/useStrategies';
import StrategyNameEditor from '@/components/StrategyNameEditor';

const AdminDashboardPage = () => {
  const [posts, setPosts] = useState([]);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [editingStrategy, setEditingStrategy] = useState(null);
  
  const { strategies, loading: strategiesLoading, refreshStrategies } = useStrategies();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count } = await supabase.from('subscribers').select('*', { count: 'exact' });
    setSubscribersCount(count || 0);
  }

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setPosts(data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Deleted", description: "Post deleted successfully" });
      fetchPosts();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white p-8">
      <Helmet><title>Admin Dashboard</title></Helmet>

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">Research Dashboard</h1>
            <p className="text-gray-400">Manage content, strategies and view subscribers</p>
          </div>
          <div className="flex flex-wrap gap-4">
             <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400"/>
                <span className="font-bold">{subscribersCount}</span>
                <span className="text-gray-500 text-sm">Subscribers</span>
             </div>
             
             <Link to="/admin/strategies">
                <Button className="bg-emerald-700/50 text-emerald-100 hover:bg-emerald-600 border border-emerald-600/50">
                    <BarChart3 className="w-4 h-4 mr-2" /> Manage Strategy Data
                </Button>
             </Link>

            <Link to="/research">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
                <FileText className="w-4 h-4 mr-2" /> View Research
              </Button>
            </Link>
            
            <Button variant="outline" onClick={handleLogout} className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Strategy Names Management Section */}
          <div className="lg:col-span-1 bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-blue-400"/> Strategy Names
               </h2>
               {strategiesLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500"/>}
            </div>
            
            <div className="space-y-3">
              {strategiesLoading ? (
                 <p className="text-sm text-gray-500">Loading strategies...</p>
              ) : strategies.length === 0 ? (
                 <p className="text-sm text-gray-500">No strategies found.</p>
              ) : (
                 strategies.map(strategy => (
                    <div key={strategy.id} className="flex items-center justify-between bg-gray-950/50 p-3 rounded-lg border border-gray-800/50">
                       <div>
                          <p className="font-medium text-sm">{strategy.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{strategy.key}</p>
                       </div>
                       <Button 
                         size="icon" 
                         variant="ghost" 
                         onClick={() => setEditingStrategy(strategy)}
                         className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-800"
                       >
                         <Edit className="w-3 h-3" />
                       </Button>
                    </div>
                 ))
              )}
            </div>
          </div>

          {/* Blog Posts Section */}
          <div className="lg:col-span-2">
             <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Articles</h2>
                <Link to="/admin/posts/new">
                  <Button className="bg-white text-black hover:bg-gray-200">
                    <Plus className="w-4 h-4 mr-2" /> New Article
                  </Button>
                </Link>
             </div>

             <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium">
                           {post.title}
                           <div className="text-xs text-gray-500 mt-1">{new Date(post.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded text-xs bg-gray-800 border border-gray-700">
                            {post.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {post.published ? (
                            <span className="text-green-400 text-xs font-bold uppercase">Published</span>
                          ) : (
                            <span className="text-yellow-400 text-xs font-bold uppercase">Draft</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <a href={`/research/${post.slug}`} target="_blank" rel="noreferrer">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                                  <Eye className="w-4 h-4" />
                              </Button>
                          </a>
                          <Link to={`/admin/posts/${post.id}/edit`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDelete(post.id)}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {posts.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                          No articles found. Create your first one!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Edit Modal */}
        <StrategyNameEditor 
           strategy={editingStrategy} 
           isOpen={!!editingStrategy} 
           onClose={() => setEditingStrategy(null)} 
        />
        
      </div>
    </div>
  );
};

export default AdminDashboardPage;