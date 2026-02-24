import { BrowserWindow } from 'electron'

export async function exportToPdf(_parentWindow: BrowserWindow, html: string): Promise<Buffer> {
  // Create a hidden window with just the document content
  const printWindow = new BrowserWindow({
    show: false,
    width: 816, // ~8.5 inches at 96dpi
    height: 1056, // ~11 inches
    webPreferences: {
      sandbox: true
    }
  })

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #1a1a1a;
    padding: 0.75in 1in;
  }
  h1 { font-size: 24pt; font-weight: 700; margin: 0.5em 0 0.3em; }
  h2 { font-size: 18pt; font-weight: 600; margin: 0.4em 0 0.25em; }
  h3 { font-size: 14pt; font-weight: 600; margin: 0.35em 0 0.2em; }
  h4, h5, h6 { font-size: 12pt; font-weight: 600; margin: 0.3em 0 0.15em; }
  p { margin: 0.2em 0; }
  ul, ol { padding-left: 1.5em; margin: 0.3em 0; }
  li { margin: 0.1em 0; }
  blockquote {
    border-left: 3px solid #999;
    padding-left: 0.8em;
    margin: 0.4em 0;
    color: #555;
  }
  pre {
    background: #f4f4f4;
    padding: 0.6em;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 10pt;
    overflow-x: auto;
    margin: 0.4em 0;
  }
  code {
    background: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 10pt;
  }
  pre code { background: none; padding: 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.4em 0;
  }
  th, td {
    border: 1px solid #ccc;
    padding: 6px 10px;
    text-align: left;
    font-size: 11pt;
  }
  th { background: #f5f5f5; font-weight: 600; }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; text-decoration: underline; }
  hr { border: none; border-top: 1px solid #ddd; margin: 0.8em 0; }
  mark { background-color: #fef08a; }
</style>
</head>
<body>${html}</body>
</html>`

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`)

  // Wait for content to render
  await new Promise((resolve) => setTimeout(resolve, 500))

  const data = await printWindow.webContents.printToPDF({
    printBackground: true,
    margins: {
      marginType: 'custom',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    },
    pageSize: 'Letter'
  })

  printWindow.destroy()
  return Buffer.from(data)
}
