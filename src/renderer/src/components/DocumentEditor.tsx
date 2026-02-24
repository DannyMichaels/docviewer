import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TableExtension from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useEffect, useCallback, useRef } from 'react'
import { useDocumentStore } from '../store/document-store'
import ResizableImage from './ResizableImage'
import EditorContextMenu from './EditorContextMenu'

const ResizableImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}) },
      height: { default: null, renderHTML: (attrs) => (attrs.height ? { height: attrs.height } : {}) }
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImage)
  }
})

interface DocumentEditorProps {
  onEditorReady: (editor: ReturnType<typeof useEditor>) => void
}

export default function DocumentEditor({ onEditorReady }: DocumentEditorProps) {
  const { activeTabId, tabs, markDirty } = useDocumentStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Highlight.configure({
        multicolor: true
      }),
      Link.configure({
        openOnClick: false,
        autolink: true
      }),
      ResizableImageExtension.configure({
        inline: false,
        allowBase64: true
      }),
      TextStyle,
      Color,
      TableExtension.configure({
        resizable: true
      }),
      TableRow,
      TableCell,
      TableHeader
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap'
      },
      handleClick: (_view, _pos, event) => {
        // Ctrl+Click or Meta+Click opens links in system browser
        if (event.ctrlKey || event.metaKey) {
          const target = (event.target as HTMLElement).closest('a')
          if (target?.href) {
            event.preventDefault()
            window.open(target.href, '_blank')
            return true
          }
        }
        return false
      }
    },
    onUpdate: ({ editor: ed }) => {
      if (activeTabId) {
        markDirty(activeTabId)
        useDocumentStore.getState().updateTab(activeTabId, { html: ed.getHTML() })
      }
    }
  })

  // Notify parent of editor instance
  useEffect(() => {
    onEditorReady(editor)
  }, [editor, onEditorReady])

  // Save editor content back to store when switching away, restore when switching to
  const prevTabIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!editor) return

    // Save content of the tab we're leaving
    const prevId = prevTabIdRef.current
    if (prevId && prevId !== activeTab?.id) {
      const html = editor.getHTML()
      useDocumentStore.getState().updateTab(prevId, { html })
    }

    // Load content of the tab we're switching to
    if (activeTab && activeTab.type !== 'pdf') {
      if (activeTab.html) {
        editor.commands.setContent(activeTab.html)
      } else {
        editor.commands.setContent('')
      }
    }

    prevTabIdRef.current = activeTab?.id ?? null
  }, [editor, activeTab?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update window title
  useEffect(() => {
    if (activeTab) {
      const prefix = activeTab.dirty ? '* ' : ''
      window.api.setTitle(`DocViewer - ${prefix}${activeTab.fileName}`)
    } else {
      window.api.setTitle('DocViewer')
    }
  }, [activeTab?.dirty, activeTab?.fileName]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle drag & drop images
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!editor) return
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
      if (files.length === 0) return

      e.preventDefault()
      for (const file of files) {
        const reader = new FileReader()
        reader.onload = () => {
          editor.chain().focus().setImage({ src: reader.result as string }).run()
        }
        reader.readAsDataURL(file)
      }
    },
    [editor]
  )

  if (!activeTab || activeTab.type === 'pdf') return null

  return (
    <div
      className="editor-container"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="editor-page">
        <EditorContent editor={editor} />
      </div>
      <EditorContextMenu editor={editor} />
    </div>
  )
}
