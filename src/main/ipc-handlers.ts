import { ipcMain, BrowserWindow, dialog } from 'electron'
import { showOpenDialog, showSaveDialog, writeFileBuffer, showExportPdfDialog } from './file-service'
import { importDocx } from './conversion/docx-importer'
import { exportDocx } from './conversion/docx-exporter'
import { convertDocToDocx, isLibreOfficeAvailable } from './conversion/doc-converter'
import { exportToPdf } from './conversion/pdf-exporter'
import { readFile } from 'fs/promises'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('file:open-path', async (_event, filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase()
    const fileName = filePath.split(/[\\/]/).pop() || 'Untitled'

    if (ext === 'pdf') {
      const buffer = await readFile(filePath)
      return {
        type: 'pdf' as const,
        filePath,
        fileName,
        data: buffer.toString('base64')
      }
    }

    let docxBuffer: Buffer

    if (ext === 'doc') {
      const available = await isLibreOfficeAvailable()
      if (!available) {
        dialog.showErrorBox(
          'LibreOffice Required',
          'LibreOffice is needed to open .doc files.\n\nPlease install LibreOffice from:\nhttps://www.libreoffice.org/download/'
        )
        return null
      }
      const rawBuffer = await readFile(filePath)
      docxBuffer = await convertDocToDocx(rawBuffer, fileName)
    } else {
      docxBuffer = await readFile(filePath)
    }

    const importResult = await importDocx(docxBuffer)
    return {
      type: 'docx' as const,
      filePath,
      fileName,
      html: importResult.html,
      messages: importResult.messages
    }
  })

  ipcMain.handle('file:open', async () => {
    const result = await showOpenDialog(mainWindow)
    if (!result) return null

    const ext = result.filePath.split('.').pop()?.toLowerCase()

    if (ext === 'pdf') {
      return {
        type: 'pdf' as const,
        filePath: result.filePath,
        fileName: result.fileName,
        data: result.buffer.toString('base64')
      }
    }

    let docxBuffer: Buffer

    if (ext === 'doc') {
      const available = await isLibreOfficeAvailable()
      if (!available) {
        dialog.showErrorBox(
          'LibreOffice Required',
          'LibreOffice is needed to open .doc files.\n\nPlease install LibreOffice from:\nhttps://www.libreoffice.org/download/'
        )
        return null
      }
      docxBuffer = await convertDocToDocx(result.buffer, result.fileName)
    } else {
      docxBuffer = result.buffer
    }

    const importResult = await importDocx(docxBuffer)

    return {
      type: 'docx' as const,
      filePath: result.filePath,
      fileName: result.fileName,
      html: importResult.html,
      messages: importResult.messages
    }
  })

  ipcMain.handle('file:save', async (_event, args: { filePath: string; json: unknown }) => {
    try {
      const buffer = await exportDocx(args.json)
      await writeFileBuffer(args.filePath, buffer)
      return { success: true, filePath: args.filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('file:save-as', async (_event, args: { json: unknown; defaultPath?: string }) => {
    const filePath = await showSaveDialog(mainWindow, args.defaultPath)
    if (!filePath) return null

    try {
      const buffer = await exportDocx(args.json)
      await writeFileBuffer(filePath, buffer)
      return { success: true, filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('file:export-pdf', async (_event, args: { defaultPath?: string; html?: string }) => {
    const filePath = await showExportPdfDialog(mainWindow, args.defaultPath)
    if (!filePath) return null

    try {
      const buffer = await exportToPdf(mainWindow, args.html || '<p>Empty document</p>')
      await writeFileBuffer(filePath, buffer)
      return { success: true, filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
      const buffer = await readFile(filePath)
      return { success: true, data: buffer.toString('base64') }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('app:set-title', (_event, title: string) => {
    mainWindow.setTitle(title)
  })

  ipcMain.on('app:confirm-close', () => {
    mainWindow.removeAllListeners('close')
    mainWindow.close()
  })

  ipcMain.handle(
    'dialog:unsaved',
    async (_event, fileName: string): Promise<'save' | 'discard' | 'cancel'> => {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Unsaved Changes',
        message: `"${fileName}" has unsaved changes.`,
        detail: 'Do you want to save your changes before closing?',
        buttons: ['Save', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2
      })
      return (['save', 'discard', 'cancel'] as const)[response]
    }
  )

  ipcMain.handle('app:has-dirty-tabs', async () => {
    return new Promise<boolean>((resolve) => {
      mainWindow.webContents.send('query:has-dirty-tabs')
      ipcMain.once('reply:has-dirty-tabs', (_e, hasDirty: boolean) => {
        resolve(hasDirty)
      })
    })
  })
}
