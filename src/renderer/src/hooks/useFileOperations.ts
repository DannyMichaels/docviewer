import { useCallback, useEffect, useRef } from 'react'
import { useDocumentStore, generateTabId } from '../store/document-store'
import type { Editor } from '@tiptap/react'

export function useFileOperations(editor: Editor | null) {
  const { addTab, updateTab, markClean, getActiveTab } = useDocumentStore()
  const editorRef = useRef(editor)
  editorRef.current = editor

  const newFile = useCallback(() => {
    const id = generateTabId()
    addTab({
      id,
      fileName: 'Untitled.docx',
      filePath: null,
      type: 'new',
      dirty: false
    })
    if (editorRef.current) {
      editorRef.current.commands.setContent('')
    }
  }, [addTab])

  const openFile = useCallback(async () => {
    const result = await window.api.openFile()
    if (!result) return

    const id = generateTabId()

    if (result.type === 'pdf') {
      addTab({
        id,
        fileName: result.fileName,
        filePath: result.filePath,
        type: 'pdf',
        pdfData: result.data,
        dirty: false
      })
    } else {
      addTab({
        id,
        fileName: result.fileName,
        filePath: result.filePath,
        type: 'docx',
        html: result.html,
        dirty: false
      })
      if (editorRef.current && result.html) {
        editorRef.current.commands.setContent(result.html)
      }
    }
  }, [addTab])

  const savePdfAs = useCallback(async (): Promise<boolean> => {
    const tab = getActiveTab()
    if (!tab || tab.type !== 'pdf' || !tab.pdfData) return false

    const result = await window.api.savePdfAs({
      pdfBase64: tab.pdfData,
      signatures: (tab.signatures || []).map((s) => ({
        page: s.page,
        x: s.x,
        y: s.y,
        width: s.width,
        dataUrl: s.dataUrl
      })),
      defaultPath: tab.filePath || tab.fileName
    })

    if (result && result.success && result.filePath) {
      const newFileName = result.filePath.split(/[\\/]/).pop() || tab.fileName
      updateTab(tab.id, { filePath: result.filePath, fileName: newFileName })
      markClean(tab.id)
      window.api.setTitle(`DocViewer - ${newFileName}`)
      return true
    }
    return false
  }, [getActiveTab, updateTab, markClean])

  const saveFileAs = useCallback(async (): Promise<boolean> => {
    const tab = getActiveTab()
    if (!tab) return false

    if (tab.type === 'pdf') return savePdfAs()

    if (!editorRef.current) return false

    const json = editorRef.current.getJSON()
    const result = await window.api.saveFileAs({
      json,
      defaultPath: tab.filePath || tab.fileName
    })

    if (result && result.success && result.filePath) {
      const newFileName = result.filePath.split(/[\\/]/).pop() || tab.fileName
      updateTab(tab.id, {
        filePath: result.filePath,
        fileName: newFileName
      })
      markClean(tab.id)
      window.api.setTitle(`DocViewer - ${newFileName}`)
      return true
    }
    return false
  }, [getActiveTab, updateTab, markClean, savePdfAs])

  const saveFile = useCallback(async (): Promise<boolean> => {
    const tab = getActiveTab()
    if (!tab) return false

    if (tab.type === 'pdf') return savePdfAs()

    if (!editorRef.current) return false

    const json = editorRef.current.getJSON()

    if (tab.filePath) {
      const result = await window.api.saveFile({ filePath: tab.filePath, json })
      if (result.success) {
        markClean(tab.id)
        window.api.setTitle(`DocViewer - ${tab.fileName}`)
        return true
      }
      return false
    } else {
      return saveFileAs()
    }
  }, [getActiveTab, markClean, saveFileAs, savePdfAs])

  const exportPdf = useCallback(async () => {
    const tab = getActiveTab()
    if (!editorRef.current) return

    const html = editorRef.current.getHTML()
    await window.api.exportPdf({
      defaultPath: tab?.filePath || tab?.fileName,
      html
    })
  }, [getActiveTab])

  // Open file by path (from CLI / context menu / second instance)
  const openFilePath = useCallback(async (filePath: string) => {
    const result = await window.api.openFilePath(filePath)
    if (!result) return

    const id = generateTabId()

    if (result.type === 'pdf') {
      addTab({
        id,
        fileName: result.fileName,
        filePath: result.filePath,
        type: 'pdf',
        pdfData: result.data,
        dirty: false
      })
    } else {
      addTab({
        id,
        fileName: result.fileName,
        filePath: result.filePath,
        type: 'docx',
        html: result.html,
        dirty: false
      })
      if (editorRef.current && result.html) {
        editorRef.current.commands.setContent(result.html)
      }
    }
  }, [addTab])

  // Listen for menu events and file open requests
  useEffect(() => {
    const cleanups = [
      window.api.onMenuNew(newFile),
      window.api.onMenuOpen(openFile),
      window.api.onMenuSave(saveFile),
      window.api.onMenuSaveAs(saveFileAs),
      window.api.onMenuExportPdf(exportPdf),
      window.api.onOpenFilePath((_event, filePath) => openFilePath(filePath))
    ]

    // Signal to main process that renderer is ready to receive files
    window.api.signalReady()

    return () => cleanups.forEach((fn) => fn())
  }, [newFile, openFile, openFilePath, saveFile, saveFileAs, exportPdf])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'n') {
        e.preventDefault()
        newFile()
      } else if (mod && e.key === 'o') {
        e.preventDefault()
        openFile()
      } else if (mod && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        saveFileAs()
      } else if (mod && e.key === 's') {
        e.preventDefault()
        saveFile()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [newFile, openFile, saveFile, saveFileAs])

  return { newFile, openFile, saveFile, saveFileAs, exportPdf }
}
