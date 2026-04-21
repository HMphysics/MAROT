import React from 'react';
import { Calendar } from 'lucide-react';
import MarotLogo from '@/components/MarotLogo';
import { cn } from '@/lib/utils';

const ArticlePreview = ({ title, category, excerpt, coverImage, content, date }) => {
  const displayDate = date 
    ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  // Handle content depending on format (string vs object)
  const htmlContent = typeof content === 'object' && content?.html ? content.html : (typeof content === 'string' ? content : '');

  return (
    <div className="bg-[#0b0c10] text-white min-h-[800px] h-full overflow-y-auto border border-gray-800 rounded-xl shadow-2xl relative">
      <div className="absolute top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm px-4 py-2 border-b border-gray-800 z-10 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Preview</span>
        <div className="flex gap-1">
             <div className="w-2 h-2 rounded-full bg-red-500"></div>
             <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>

      <div className="p-8 pt-16 max-w-4xl mx-auto">
        <div className="mb-6">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/30 px-3 py-1 rounded-full bg-blue-500/10">
              {category || 'Uncategorized'}
            </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
          {title || 'Untitled Article'}
        </h1>

        {excerpt && (
            <p className="text-xl md:text-2xl text-gray-400 mb-6 font-serif leading-relaxed font-light">
              {excerpt}
            </p>
        )}

        <div className="flex items-center justify-between text-gray-500 text-sm border-y border-gray-800 py-4 mb-8">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {displayDate}
            </div>
            <div>Marot Research</div>
        </div>

        {coverImage && (
            <div className="mb-10 -mx-4 rounded-xl overflow-hidden border border-gray-800">
              <img src={coverImage} alt="Cover" className="w-full h-auto" />
            </div>
        )}

        {/* Render HTML content safely */}
        <div 
          className="prose prose-invert max-w-none prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-p:text-gray-300 prose-p:font-serif prose-p:leading-relaxed prose-li:text-gray-300 prose-img:rounded-xl prose-a:text-blue-400 prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400 prose-blockquote:italic [&>h1]:text-5xl [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:leading-tight [&>h2]:text-3xl [&>h2]:mb-4 [&>h2]:mt-6 [&>h2]:leading-snug [&>h3]:text-2xl [&>h3]:mb-3 [&>h3]:mt-4"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};

export default ArticlePreview;