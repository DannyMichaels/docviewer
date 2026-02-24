import type { Editor } from '@tiptap/react'
import { useDocumentStore } from '../store/document-store'

interface StatusBarProps {
  editor: Editor | null
}

export default function StatusBar({ editor }: StatusBarProps) {
  const activeTab = useDocumentStore((s) => {
    return s.tabs.find((t) => t.id === s.activeTabId)
  })

  const wordCount = editor
    ? editor.state.doc.textContent.split(/\s+/).filter(Boolean).length
    : 0
  const charCount = editor ? editor.state.doc.textContent.length : 0

  return (
    <div className="status-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {activeTab && (
          <>
            <span>
              <span className={`status-dot ${activeTab.dirty ? 'dirty' : 'clean'}`} />
              {activeTab.dirty ? 'Unsaved' : 'Saved'}
            </span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span>{activeTab.type === 'pdf' ? 'PDF Viewer' : 'Editor'}</span>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {editor && activeTab?.type !== 'pdf' && (
          <>
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </>
        )}
      </div>
    </div>
  )
}
