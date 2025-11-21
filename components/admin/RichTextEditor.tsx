'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  ImageIcon,
  Undo,
  Redo
} from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { marked } from 'marked'
import TurndownService from 'turndown'

// Configure marked for Markdown→HTML
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Configure turndown for HTML→Markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

// Helper: Normalize Markdown headings
function normalizeHeadings(md: string): string {
  if (!md) return md
  let out = md

  // 1) Gom các khối # # # → ### (xoá khoảng trắng giữa #)
  out = out.replace(/^(\s*)(#)(\s+#)+/gm, (full, indent, hash, rest) => {
    const count = 1 + (rest.match(/#/g)?.length || 0)
    return `${indent}${'#'.repeat(count)} `
  })

  // 2) Đảm bảo có space sau dãy # (sửa kiểu "###Problem" → "### Problem")
  out = out.replace(/^(\s*#+)([^\s#])/gm, '$1 $2')

  return out
}

// Helper: Markdown → HTML
function markdownToHtml(markdown: string): string {
  if (!markdown) return ''

  // Normalize headings first
  let normalized = normalizeHeadings(markdown)

  // Strip wrapping <p> tags if AI parser added them
  if (normalized.startsWith('<p>') && normalized.endsWith('</p>')) {
    normalized = normalized.slice(3, -4)
  }
  normalized = normalized.replace(/<\/?p>/g, '')

  return marked.parse(normalized) as string
}

// Helper: HTML → Markdown
function htmlToMarkdown(html: string): string {
  if (!html) return ''

  let markdown = turndownService.turndown(html)

  // Normalize headings after conversion
  markdown = normalizeHeadings(markdown)

  return markdown
}

interface RichTextEditorProps {
  content: string // Markdown format
  onChange: (markdown: string) => void // Returns Markdown
  placeholder?: string
  className?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const addLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:')

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
      {/* Text formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
        type="button"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
        type="button"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-300' : ''}`}
        type="button"
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-300' : ''}`}
        type="button"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
        type="button"
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
        type="button"
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
        type="button"
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
        type="button"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
        type="button"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Alignment */}
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
        type="button"
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
        type="button"
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
        type="button"
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Quote & Code */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-300' : ''}`}
        type="button"
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('codeBlock') ? 'bg-gray-300' : ''}`}
        type="button"
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Link & Image */}
      <button
        onClick={addLink}
        className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-300' : ''}`}
        type="button"
        title="Add Link"
      >
        <Link2 className="h-4 w-4" />
      </button>
      <button
        onClick={addImage}
        className="p-2 rounded hover:bg-gray-200"
        type="button"
        title="Add Image"
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Undo & Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
        type="button"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
        type="button"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start typing...', className = '' }: RichTextEditorProps) {
  // Convert initial Markdown content to HTML for Tiptap
  const initialHtml = markdownToHtml(content)

  // Track if update is from internal editor change (to prevent cursor jump)
  const isInternalUpdateRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialHtml,
    onUpdate: ({ editor }) => {
      // Mark this as an internal update
      isInternalUpdateRef.current = true

      // Convert HTML back to Markdown before calling onChange
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      onChange(markdown)

      // Reset flag after a short delay to allow parent to update
      setTimeout(() => {
        isInternalUpdateRef.current = false
      }, 0)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    immediatelyRender: false,
  })

  // Update editor content when prop changes from EXTERNAL source only
  useEffect(() => {
    if (!editor || !content) return

    // Skip update if this change came from internal editor update (user typing)
    if (isInternalUpdateRef.current) return

    const html = markdownToHtml(content)
    const currentHtml = editor.getHTML()

    // Only update if content actually changed to avoid unnecessary re-renders
    if (html !== currentHtml) {
      editor.commands.setContent(html, { emitUpdate: false }) // Don't emit update event to prevent infinite loop
    }
  }, [editor, content])

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
        `
      }} />
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
