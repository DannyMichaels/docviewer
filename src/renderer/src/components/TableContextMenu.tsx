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
  Split
} from 'lucide-react'

interface TableContextMenuProps {
  editor: Editor | null
}

interface MenuPosition {
  x: number
  y: number
}

export default function TableContextMenu({ editor }: TableContextMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!editor) return

      // Check if right-click is inside a table
      const target = e.target as HTMLElement
      const tableEl = target.closest('table')
      if (!tableEl) {
        setPosition(null)
        return
      }

      // Check editor is active in a table
      if (!editor.isActive('table')) return

      e.preventDefault()
      setPosition({ x: e.clientX, y: e.clientY })
    }

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null)
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', handleClick)
    }
  }, [editor])

  if (!position || !editor) return null

  const items = [
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
      label: 'Toggle Header Row',
      icon: <Plus size={14} />,
      action: () => editor.chain().focus().toggleHeaderRow().run(),
      enabled: editor.can().toggleHeaderRow()
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
      {items.map((item, i) => {
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
              setPosition(null)
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
