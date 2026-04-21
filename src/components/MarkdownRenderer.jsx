import React from 'react';
import { cn } from '@/lib/utils';

const MarkdownRenderer = ({ content, className = "" }) => {
  if (!content) return null;

  // Split text by markdown patterns:
  // **bold**
  // *italic*
  // [text](url)
  // `code`
  // # Heading (simple support if passed as single line)
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\)|`.*?`)/g;
  const parts = content.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Bold
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        // Italic
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index} className="italic text-gray-300">{part.slice(1, -1)}</em>;
        }
        // Code
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={index} className="bg-gray-800 rounded px-1.5 py-0.5 font-mono text-sm text-blue-300 border border-gray-700">{part.slice(1, -1)}</code>;
        }
        // Link
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          return (
            <a 
              key={index} 
              href={linkMatch[2]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 hover:underline decoration-blue-400/30 underline-offset-4 transition-colors"
            >
              {linkMatch[1]}
            </a>
          );
        }
        
        return part;
      })}
    </span>
  );
};

export default MarkdownRenderer;