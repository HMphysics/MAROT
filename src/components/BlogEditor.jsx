import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, 
  Undo, Redo, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const MenuButton = ({ onClick, isActive, disabled, children, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "p-2 rounded hover:bg-gray-700 transition-colors text-gray-400",
      isActive && "bg-gray-700 text-white",
      disabled && "opacity-50 cursor-not-allowed"
    )}
    title={title}
    type="button"
  >
    {children}
  </button>
);

const BlogEditor = ({ content, onChange, className }) => {
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 hover:underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-6 border border-gray-700 shadow-lg',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your story...',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-gray-500 before:float-left before:pointer-events-none before:h-0',
      }),
    ],
    editorProps: {
      attributes: {
        // Explicitly matching the typography requirements:
        // H1: text-5xl font-bold mb-6 mt-8 leading-tight
        // H2: text-3xl font-bold mb-4 mt-6 leading-snug
        // H3: text-2xl font-semibold mb-3 mt-4
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] text-lg leading-relaxed text-gray-300 [&>h1]:text-5xl [&>h1]:font-bold [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:leading-tight [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-6 [&>h2]:leading-snug [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:mb-3 [&>h3]:mt-4',
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image'));

        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            uploadImage(file).then(url => {
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            });
          }
          return true;
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      // Return both HTML and JSON to be flexible
      onChange({
        html: editor.getHTML(),
        json: editor.getJSON()
      });
    },
  });

  // Load initial content
  useEffect(() => {
    if (editor && content) {
      // Check if content is object (new format) or string/array (old format)
      if (typeof content === 'object' && content.html) {
         // Only set if content is different to avoid cursor jumps/infinite loops
         if (editor.getHTML() !== content.html) {
             editor.commands.setContent(content.html);
         }
      } else if (Array.isArray(content)) {
         console.warn("Legacy content format detected. Please manually rewrite or update.");
      } else if (typeof content === 'string') {
         if (editor.getHTML() !== content) {
            editor.commands.setContent(content);
         }
      }
    }
  }, [editor, content]);

  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `content/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
        
      return publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Could not upload image.",
      });
      return null;
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("flex flex-col border border-gray-800 rounded-xl bg-gray-950/50 overflow-hidden w-full", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
        <MenuButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            isActive={editor.isActive('bold')} 
            title="Bold (Cmd+B)"
        >
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            isActive={editor.isActive('italic')} 
            title="Italic (Cmd+I)"
        >
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            isActive={editor.isActive('underline')} 
            title="Underline (Cmd+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </MenuButton>
        
        <div className="w-px h-6 bg-gray-700 mx-1" />
        
        <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            isActive={editor.isActive('heading', { level: 1 })} 
            title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </MenuButton>
        <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
            isActive={editor.isActive('heading', { level: 2 })} 
            title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
            isActive={editor.isActive('heading', { level: 3 })} 
            title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        <MenuButton 
            onClick={() => editor.chain().focus().setTextAlign('left').run()} 
            isActive={editor.isActive({ textAlign: 'left' })} 
            title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </MenuButton>
        <MenuButton 
            onClick={() => editor.chain().focus().setTextAlign('center').run()} 
            isActive={editor.isActive({ textAlign: 'center' })} 
            title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </MenuButton>
        <MenuButton 
            onClick={() => editor.chain().focus().setTextAlign('right').run()} 
            isActive={editor.isActive({ textAlign: 'right' })} 
            title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        <MenuButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            isActive={editor.isActive('bulletList')} 
            title="Bullet List"
        >
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            isActive={editor.isActive('orderedList')} 
            title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
        <MenuButton 
            onClick={() => editor.chain().focus().toggleBlockquote().run()} 
            isActive={editor.isActive('blockquote')} 
            title="Quote"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        <MenuButton onClick={setLink} isActive={editor.isActive('link')} title="Add Link">
          <LinkIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={addImage} title="Add Image">
          <ImageIcon className="w-4 h-4" />
        </MenuButton>

        <div className="flex-1" />

        <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Editor */}
      <div className="p-8 md:p-12 min-h-[600px] cursor-text bg-[#0f1115]" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default BlogEditor;