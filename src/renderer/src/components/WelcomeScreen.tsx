import { FileText, FolderOpen, FilePlus } from 'lucide-react'

interface WelcomeScreenProps {
  onNew: () => void
  onOpen: () => void
}

export default function WelcomeScreen({ onNew, onOpen }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-card">
        <div style={{ marginBottom: 20 }}>
          <FileText size={48} color="#7c3aed" />
        </div>
        <h1>DocViewer</h1>
        <p>
          Open, edit, and save documents.<br />
          Supports .docx, .doc, and .pdf files.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button type="button" onClick={onNew} className="welcome-btn-primary">
            <FilePlus size={18} />
            New Document
          </button>
          <button type="button" onClick={onOpen} className="welcome-btn-secondary">
            <FolderOpen size={18} />
            Open File
          </button>
        </div>
      </div>
    </div>
  )
}
