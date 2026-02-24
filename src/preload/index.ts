import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  openFile: () => ipcRenderer.invoke('file:open'),
  openFilePath: (filePath: string) => ipcRenderer.invoke('file:open-path', filePath),
  signalReady: () => ipcRenderer.send('renderer:ready'),
  onOpenFilePath: (callback: (_event: unknown, filePath: string) => void) => {
    ipcRenderer.on('open-file-path', callback)
    return () => ipcRenderer.removeListener('open-file-path', callback)
  },
  saveFile: (args: { filePath: string; json: unknown }) => ipcRenderer.invoke('file:save', args),
  saveFileAs: (args: { json: unknown; defaultPath?: string }) =>
    ipcRenderer.invoke('file:save-as', args),
  exportPdf: (args: { defaultPath?: string; html?: string }) => ipcRenderer.invoke('file:export-pdf', args),
  savePdfAs: (args: {
    pdfBase64: string
    signatures: Array<{ page: number; x: number; y: number; width: number; dataUrl: string }>
    defaultPath?: string
  }) => ipcRenderer.invoke('file:save-pdf', args),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  setTitle: (title: string) => ipcRenderer.invoke('app:set-title', title),

  // Menu events from main process
  onMenuNew: (callback: () => void) => {
    ipcRenderer.on('menu:new', callback)
    return () => ipcRenderer.removeListener('menu:new', callback)
  },
  onMenuOpen: (callback: () => void) => {
    ipcRenderer.on('menu:open', callback)
    return () => ipcRenderer.removeListener('menu:open', callback)
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu:save', callback)
    return () => ipcRenderer.removeListener('menu:save', callback)
  },
  onMenuSaveAs: (callback: () => void) => {
    ipcRenderer.on('menu:save-as', callback)
    return () => ipcRenderer.removeListener('menu:save-as', callback)
  },
  onMenuExportPdf: (callback: () => void) => {
    ipcRenderer.on('menu:export-pdf', callback)
    return () => ipcRenderer.removeListener('menu:export-pdf', callback)
  },

  showUnsavedDialog: (fileName: string): Promise<'save' | 'discard' | 'cancel'> =>
    ipcRenderer.invoke('dialog:unsaved', fileName),

  onQueryHasDirtyTabs: (callback: () => void) => {
    ipcRenderer.on('query:has-dirty-tabs', callback)
    return () => ipcRenderer.removeListener('query:has-dirty-tabs', callback)
  },
  replyHasDirtyTabs: (hasDirty: boolean) => ipcRenderer.send('reply:has-dirty-tabs', hasDirty),

  onBeforeClose: (callback: () => void) => {
    ipcRenderer.on('app:before-close', callback)
    return () => ipcRenderer.removeListener('app:before-close', callback)
  },
  confirmClose: () => ipcRenderer.send('app:confirm-close')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error Fallback for non-isolated context
  window.electron = electronAPI
  // @ts-expect-error Fallback for non-isolated context
  window.api = api
}
