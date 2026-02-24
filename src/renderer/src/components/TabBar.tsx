import { useDocumentStore } from '../store/document-store'
import { X, FileText, FileImage } from 'lucide-react'

async function handleCloseTab(
  tabId: string,
  fileName: string,
  dirty: boolean,
  saveFn: (() => Promise<boolean>) | null
) {
  const { removeTab, setActiveTab } = useDocumentStore.getState()

  if (!dirty) {
    removeTab(tabId)
    return
  }

  const choice = await window.api.showUnsavedDialog(fileName)
  if (choice === 'cancel') return
  if (choice === 'save' && saveFn) {
    // Switch to the tab so the editor loads its content before saving
    setActiveTab(tabId)
    // Small delay to let React re-render with the tab's content
    await new Promise((r) => setTimeout(r, 50))
    const saved = await saveFn()
    if (!saved) return
  }
  removeTab(tabId)
}

interface TabBarProps {
  onSave?: () => Promise<boolean>
}

export default function TabBar({ onSave }: TabBarProps) {
  const { tabs, activeTabId, setActiveTab } = useDocumentStore()

  if (tabs.length === 0) return null

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.type === 'pdf' ? (
            <FileImage size={14} className="shrink-0" style={{ color: '#ef4444' }} />
          ) : (
            <FileText size={14} className="shrink-0" style={{ color: '#7c3aed' }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tab.dirty ? '\u2022 ' : ''}
            {tab.fileName}
          </span>
          <button
            type="button"
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation()
              handleCloseTab(tab.id, tab.fileName, tab.dirty, onSave ?? null)
            }}
            title="Close tab"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
