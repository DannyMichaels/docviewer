import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Image,
  Table,
  Highlighter,
  RemoveFormatting,
  Palette
} from 'lucide-react'

interface ToolbarProps {
  editor: Editor | null
}

function Btn({
  onClick,
  active,
  disabled,
  tooltip,
  children
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  tooltip: string
  children: React.ReactNode
}) {
  return (
    <div className="toolbar-btn-wrapper">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`toolbar-btn ${active ? 'active' : ''}`}
      >
        {children}
      </button>
      <span className="toolbar-tooltip">{tooltip}</span>
    </div>
  )
}

function Divider() {
  return <div className="toolbar-divider" />
}

export default function Toolbar({ editor }: ToolbarProps) {
  // Force re-render on every editor transaction (selection change, format toggle, etc.)
  const [, setTick] = useState(0)
  const [linkPopover, setLinkPopover] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editor) return
    const handler = () => setTick((t) => t + 1)
    editor.on('transaction', handler)
    return () => { editor.off('transaction', handler) }
  }, [editor])

  if (!editor) return null

  const s = 16

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string }).run()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const openLinkPopover = () => {
    // Pre-populate with existing link URL if cursor is on a link
    const existing = editor.getAttributes('link').href || ''
    setLinkUrl(existing)
    setLinkPopover(true)
    setTimeout(() => linkInputRef.current?.focus(), 50)
  }

  const applyLink = () => {
    const url = linkUrl.trim()
    if (!url) {
      // Empty URL = remove link
      editor.chain().focus().unsetLink().run()
    } else {
      const { from, to } = editor.state.selection
      const hasSelection = from !== to
      if (hasSelection) {
        editor.chain().focus().setLink({ href: url }).run()
      } else {
        editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
      }
    }
    setLinkPopover(false)
    setLinkUrl('')
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
    setLinkPopover(false)
    setLinkUrl('')
  }

  const currentHeading = (() => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) return `${i}`
    }
    return '0'
  })()

  const setHeading = (value: string) => {
    const level = parseInt(value)
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
    }
  }

  return (
    <div className="editor-toolbar">
      {/* Heading dropdown */}
      <div className="toolbar-btn-wrapper">
        <select
          className="toolbar-select"
          value={currentHeading}
          onChange={(e) => setHeading(e.target.value)}
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
          <option value="6">Heading 6</option>
        </select>
        <span className="toolbar-tooltip">Text Type</span>
      </div>

      <Divider />

      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} tooltip="Bold (Ctrl+B)">
        <Bold size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} tooltip="Italic (Ctrl+I)">
        <Italic size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} tooltip="Underline (Ctrl+U)">
        <Underline size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} tooltip="Strikethrough">
        <Strikethrough size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} tooltip="Inline Code">
        <Code size={s} />
      </Btn>

      <Divider />

      <Btn onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} active={editor.isActive('highlight')} tooltip="Highlight">
        <Highlighter size={s} />
      </Btn>
      <div className="toolbar-btn-wrapper">
        <label className="toolbar-btn" style={{ position: 'relative', cursor: 'pointer' }}>
          <Palette size={s} />
          <input
            type="color"
            defaultValue="#000000"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer'
            }}
          />
        </label>
        <span className="toolbar-tooltip">Text Color</span>
      </div>

      <Divider />

      <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} tooltip="Align Left">
        <AlignLeft size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} tooltip="Align Center">
        <AlignCenter size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} tooltip="Align Right">
        <AlignRight size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} tooltip="Justify">
        <AlignJustify size={s} />
      </Btn>

      <Divider />

      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} tooltip="Bullet List">
        <List size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} tooltip="Numbered List">
        <ListOrdered size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} tooltip="Blockquote">
        <Quote size={s} />
      </Btn>

      <Divider />

      <div className="toolbar-btn-wrapper" style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={openLinkPopover}
          className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
        >
          <Link size={s} />
        </button>
        <span className="toolbar-tooltip">Insert Link</span>
        {linkPopover && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 6,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              padding: 10,
              zIndex: 100,
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              minWidth: 320
            }}
          >
            <input
              ref={linkInputRef}
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyLink()
                if (e.key === 'Escape') { setLinkPopover(false); editor.commands.focus() }
              }}
              placeholder="https://..."
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: 13,
                border: '1px solid #d1d5db',
                borderRadius: 6,
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={applyLink}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Apply
            </button>
            {editor.isActive('link') && (
              <button
                type="button"
                onClick={removeLink}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
      <Btn onClick={addImage} tooltip="Insert Image">
        <Image size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} tooltip="Insert Table">
        <Table size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Horizontal Rule">
        <Minus size={s} />
      </Btn>

      <Divider />

      <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Undo (Ctrl+Z)">
        <Undo2 size={s} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Redo (Ctrl+Y)">
        <Redo2 size={s} />
      </Btn>

      <Divider />

      <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} tooltip="Clear Formatting">
        <RemoveFormatting size={s} />
      </Btn>
    </div>
  )
}
