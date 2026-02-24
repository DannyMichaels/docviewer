import { useState, useCallback, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { useDocumentStore } from './store/document-store'
import { useFileOperations } from './hooks/useFileOperations'
import DocumentEditor from './components/DocumentEditor'
import PdfViewer, { type PdfSignature } from './components/PdfViewer'
import Toolbar from './components/Toolbar'
import TabBar from './components/TabBar'
import StatusBar from './components/StatusBar'
import WelcomeScreen from './components/WelcomeScreen'

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const { tabs, activeTabId } = useDocumentStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  const { newFile, openFile, saveFile } = useFileOperations(editor)

  const handleEditorReady = useCallback((ed: Editor | null) => {
    setEditor(ed)
  }, [])

  // Handle window close with unsaved changes check
  useEffect(() => {
    const cleanup = window.api.onBeforeClose(async () => {
      const dirtyTabs = useDocumentStore.getState().tabs.filter((t) => t.dirty)

      if (dirtyTabs.length === 0) {
        window.api.confirmClose()
        return
      }

      for (const tab of dirtyTabs) {
        const choice = await window.api.showUnsavedDialog(tab.fileName)
        if (choice === 'cancel') return
        if (choice === 'save') {
          useDocumentStore.getState().setActiveTab(tab.id)
          const saved = await saveFile()
          if (!saved) return
        }
      }
      window.api.confirmClose()
    })
    return cleanup
  }, [saveFile])

  const showEditor = activeTab && activeTab.type !== 'pdf'
  const showPdf = activeTab && activeTab.type === 'pdf' && activeTab.pdfData

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TabBar onSave={saveFile} />
      {showEditor && <Toolbar editor={editor} />}

      {!activeTab && tabs.length === 0 && (
        <WelcomeScreen onNew={newFile} onOpen={openFile} />
      )}

      {showEditor && <DocumentEditor onEditorReady={handleEditorReady} />}

      {showPdf && (
        <PdfViewer
          data={activeTab.pdfData!}
          signatures={activeTab.signatures || []}
          onSignaturesChange={(sigs: PdfSignature[]) => {
            useDocumentStore.getState().updateTab(activeTab.id, { signatures: sigs, dirty: true })
          }}
        />
      )}

      {!activeTab && tabs.length > 0 && (
        <div className="welcome-screen" style={{ color: '#9ca3af', fontSize: 14 }}>
          Select a tab to continue editing
        </div>
      )}

      <StatusBar editor={editor} />
    </div>
  )
}
