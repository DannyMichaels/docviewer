import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc-handlers'
import { createMenu } from './menu'

// Grab the file path passed as a CLI argument (e.g. "Open with" context menu)
function getFileFromArgs(argv: string[]): string | null {
  // Skip electron exe and script path; look for a file path arg
  const args = argv.slice(is.dev ? 2 : 1)
  for (const arg of args) {
    if (!arg.startsWith('-') && /\.(docx?|pdf)$/i.test(arg)) {
      return arg
    }
  }
  return null
}

let pendingFilePath: string | null = getFileFromArgs(process.argv)

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: 'DocViewer',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.webContents.send('app:before-close')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// Single instance lock — if a second instance is launched (e.g. double-clicking another file),
// forward the file path to the existing window instead.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const filePath = getFileFromArgs(argv)
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
      if (filePath) {
        win.webContents.send('open-file-path', filePath)
      }
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.docviewer.app')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    const mainWindow = createWindow()
    createMenu(mainWindow)
    registerIpcHandlers(mainWindow)

    // Once the renderer is ready, send the pending file path if any
    ipcMain.once('renderer:ready', () => {
      if (pendingFilePath) {
        mainWindow.webContents.send('open-file-path', pendingFilePath)
        pendingFilePath = null
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        const win = createWindow()
        createMenu(win)
        registerIpcHandlers(win)
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
