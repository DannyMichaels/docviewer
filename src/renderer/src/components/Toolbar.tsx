import { useState, useEffect } from 'react'
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

  const setLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const { from, to } = editor.state.selection
    const hasSelection = from !== to
    const url = prompt('Enter URL:')
    if (!url) return
    if (hasSelection) {
      editor.chain().focus().setLink({ href: url }).run()
    } else {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
    }
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

      <Btn onClick={setLink} active={editor.isActive('link')} tooltip="Insert Link">
        <Link size={s} />
      </Btn>
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
