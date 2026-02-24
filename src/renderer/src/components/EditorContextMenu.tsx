import { useEffect, useState, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Plus,
  Minus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Merge,
  Split,
  ExternalLink,
  Pencil,
  Unlink,
  Copy
} from 'lucide-react'

interface EditorContextMenuProps {
  editor: Editor | null
}

interface MenuPosition {
  x: number
  y: number
}

type MenuContext = 'table' | 'link' | null

export default function EditorContextMenu({ editor }: EditorContextMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const [context, setContext] = useState<MenuContext>(null)
  const [linkHref, setLinkHref] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  // For inline link editing
  const [editingLink, setEditingLink] = useState(false)
  const [editUrl, setEditUrl] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!editor) return

      const target = e.target as HTMLElement

      // Check if inside the editor
      const editorEl = target.closest('.tiptap')
      if (!editorEl) {
        setPosition(null)
        setContext(null)
        return
      }

      // Check if right-click is on a link
      const linkEl = target.closest('a')
      if (linkEl) {
        e.preventDefault()
        setLinkHref(linkEl.getAttribute('href') || '')
        setContext('link')
        setPosition({ x: e.clientX, y: e.clientY })
        setEditingLink(false)
        return
      }

      // Check if right-click is inside a table
      const tableEl = target.closest('table')
      if (tableEl && editor.isActive('table')) {
        e.preventDefault()
        setContext('table')
        setPosition({ x: e.clientX, y: e.clientY })
        return
      }

      // Otherwise let native context menu through
      setPosition(null)
      setContext(null)
    }

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null)
        setContext(null)
        setEditingLink(false)
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', handleClick)
    }
  }, [editor])

  useEffect(() => {
    if (editingLink) {
      setTimeout(() => editInputRef.current?.focus(), 50)
    }
  }, [editingLink])

  if (!position || !editor || !context) return null

  const close = () => {
    setPosition(null)
    setContext(null)
    setEditingLink(false)
  }

  // Link context menu
  if (context === 'link') {
    return (
      <div
        ref={menuRef}
        className="context-menu"
        style={{ left: position.x, top: position.y }}
      >
        {editingLink ? (
          <div style={{ padding: '6px 8px', display: 'flex', gap: 4, minWidth: 260 }}>
            <input
              ref={editInputRef}
              type="text"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editor.chain().focus().extendMarkRange('link').setLink({ href: editUrl.trim() }).run()
                  close()
                }
                if (e.key === 'Escape') close()
              }}
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: 12,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                outline: 'none'
              }}
            />
            <button
              type="button"
              className="context-menu-item"
              style={{ padding: '4px 10px', minHeight: 0, borderRadius: 4, background: '#7c3aed', color: '#fff' }}
              onClick={() => {
                editor.chain().focus().extendMarkRange('link').setLink({ href: editUrl.trim() }).run()
                close()
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => {
                window.open(linkHref, '_blank')
                close()
              }}
            >
              <ExternalLink size={14} />
              Open Link
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => {
                navigator.clipboard.writeText(linkHref)
                close()
              }}
            >
              <Copy size={14} />
              Copy Link
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={(e) => {
                e.stopPropagation()
                setEditUrl(linkHref)
                setEditingLink(true)
              }}
            >
              <Pencil size={14} />
              Edit Link
            </button>
            <div className="context-menu-separator" />
            <button
              type="button"
              className="context-menu-item danger"
              onClick={() => {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
                close()
              }}
            >
              <Unlink size={14} />
              Remove Link
            </button>
          </>
        )}
      </div>
    )
  }

  // Table context menu
  const tableItems = [
    {
      label: 'Add Column Before',
      icon: <ArrowLeft size={14} />,
      action: () => editor.chain().focus().addColumnBefore().run(),
      enabled: editor.can().addColumnBefore()
    },
    {
      label: 'Add Column After',
      icon: <ArrowRight size={14} />,
      action: () => editor.chain().focus().addColumnAfter().run(),
      enabled: editor.can().addColumnAfter()
    },
    {
      label: 'Delete Column',
      icon: <Minus size={14} />,
      action: () => editor.chain().focus().deleteColumn().run(),
      enabled: editor.can().deleteColumn()
    },
    { type: 'separator' as const },
    {
      label: 'Add Row Before',
      icon: <ArrowUp size={14} />,
      action: () => editor.chain().focus().addRowBefore().run(),
      enabled: editor.can().addRowBefore()
    },
    {
      label: 'Add Row After',
      icon: <ArrowDown size={14} />,
      action: () => editor.chain().focus().addRowAfter().run(),
      enabled: editor.can().addRowAfter()
    },
    {
      label: 'Delete Row',
      icon: <Minus size={14} />,
      action: () => editor.chain().focus().deleteRow().run(),
      enabled: editor.can().deleteRow()
    },
    { type: 'separator' as const },
    {
      label: 'Merge Cells',
      icon: <Merge size={14} />,
      action: () => editor.chain().focus().mergeCells().run(),
      enabled: editor.can().mergeCells()
    },
    {
      label: 'Split Cell',
      icon: <Split size={14} />,
      action: () => editor.chain().focus().splitCell().run(),
      enabled: editor.can().splitCell()
    },
    {
      label: 'Toggle Header Cell',
      icon: <Plus size={14} />,
      action: () => editor.chain().focus().toggleHeaderCell().run(),
      enabled: editor.can().toggleHeaderCell()
    },
    { type: 'separator' as const },
    {
      label: 'Delete Table',
      icon: <Trash2 size={14} />,
      action: () => editor.chain().focus().deleteTable().run(),
      enabled: editor.can().deleteTable(),
      danger: true
    }
  ]

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: position.x, top: position.y }}
    >
      {tableItems.map((item, i) => {
        if ('type' in item && item.type === 'separator') {
          return <div key={i} className="context-menu-separator" />
        }
        const { label, icon, action, enabled, danger } = item as {
          label: string
          icon: React.ReactNode
          action: () => void
          enabled: boolean
          danger?: boolean
        }
        return (
          <button
            key={label}
            type="button"
            disabled={!enabled}
            className={`context-menu-item ${danger ? 'danger' : ''}`}
            onClick={() => {
              action()
              close()
            }}
          >
            {icon}
            {label}
          </button>
        )
      })}
    </div>
  )
}
