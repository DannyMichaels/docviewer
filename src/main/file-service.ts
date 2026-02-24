import { dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'

const DOCX_FILTERS = [
  { name: 'Supported Documents', extensions: ['docx', 'doc', 'pdf'] },
  { name: 'Word Documents', extensions: ['docx', 'doc'] },
  { name: 'PDF Documents', extensions: ['pdf'] },
  { name: 'All Files', extensions: ['*'] }
]

const SAVE_FILTERS = [
  { name: 'Word Document', extensions: ['docx'] },
  { name: 'All Files', extensions: ['*'] }
]

export async function showOpenDialog(
  window: BrowserWindow
): Promise<{ filePath: string; buffer: Buffer; fileName: string } | null> {
  const result = await dialog.showOpenDialog(window, {
    properties: ['openFile'],
    filters: DOCX_FILTERS
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const filePath = result.filePaths[0]
  const buffer = await readFile(filePath)
  const fileName = filePath.split(/[\\/]/).pop() || 'Untitled'

  return { filePath, buffer, fileName }
}

export async function showSaveDialog(
  window: BrowserWindow,
  defaultPath?: string
): Promise<string | null> {
  const result = await dialog.showSaveDialog(window, {
    defaultPath,
    filters: SAVE_FILTERS
  })

  if (result.canceled || !result.filePath) return null
  return result.filePath
}

export async function readFileBuffer(filePath: string): Promise<Buffer> {
  return readFile(filePath)
}

export async function writeFileBuffer(filePath: string, data: Buffer): Promise<void> {
  await writeFile(filePath, data)
}

export async function showExportPdfDialog(
  window: BrowserWindow,
  defaultPath?: string
): Promise<string | null> {
  const result = await dialog.showSaveDialog(window, {
    defaultPath: defaultPath?.replace(/\.\w+$/, '.pdf') || 'document.pdf',
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
  })

  if (result.canceled || !result.filePath) return null
  return result.filePath
}
