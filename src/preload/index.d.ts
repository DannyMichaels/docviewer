import { ElectronAPI } from '@electron-toolkit/preload'

interface FileOpenResult {
  type: 'docx' | 'pdf'
  filePath: string
  fileName: string
  html?: string
  data?: string
  messages?: string[]
}

interface FileSaveResult {
  success: boolean
  filePath?: string
  error?: string
}

interface FileReadResult {
  success: boolean
  data?: string
  error?: string
}

interface DocViewerAPI {
  openFile: () => Promise<FileOpenResult | null>
  openFilePath: (filePath: string) => Promise<FileOpenResult | null>
  signalReady: () => void
  onOpenFilePath: (callback: (_event: unknown, filePath: string) => void) => () => void
  saveFile: (args: { filePath: string; json: unknown }) => Promise<FileSaveResult>
  saveFileAs: (args: { json: unknown; defaultPath?: string }) => Promise<FileSaveResult | null>
  exportPdf: (args: { defaultPath?: string; html?: string }) => Promise<FileSaveResult | null>
  savePdfAs: (args: {
    pdfBase64: string
    signatures: Array<{ page: number; x: number; y: number; width: number; dataUrl: string }>
    defaultPath?: string
  }) => Promise<FileSaveResult | null>
  readFile: (filePath: string) => Promise<FileReadResult>
  setTitle: (title: string) => Promise<void>
  onMenuNew: (callback: () => void) => () => void
  onMenuOpen: (callback: () => void) => () => void
  onMenuSave: (callback: () => void) => () => void
  onMenuSaveAs: (callback: () => void) => () => void
  onMenuExportPdf: (callback: () => void) => () => void
  showUnsavedDialog: (fileName: string) => Promise<'save' | 'discard' | 'cancel'>
  onQueryHasDirtyTabs: (callback: () => void) => () => void
  replyHasDirtyTabs: (hasDirty: boolean) => void
  onBeforeClose: (callback: () => void) => () => void
  confirmClose: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DocViewerAPI
  }
}
