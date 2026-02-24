# DocViewer Electron

## Project Overview
Desktop document editor built with Electron + React + TypeScript. Opens, edits, and saves .docx/.doc/.pdf files without Microsoft Word.

## Tech Stack
- **Framework**: Electron + React + TypeScript via `electron-vite`
- **Package Manager**: pnpm
- **Editor**: TipTap (ProseMirror-based rich text editor)
- **DOCX Import**: mammoth.js (.docx → HTML)
- **DOCX Export**: docx library (ProseMirror JSON → docx builder API → .docx)
- **Legacy .doc**: LibreOffice headless CLI (.doc → .docx conversion)
- **PDF Viewing**: react-pdf (pdf.js-based, view-only + annotations)
- **PDF Export**: Electron's built-in `printToPDF()`
- **UI**: Radix UI primitives + Lucide icons + Tailwind CSS
- **State**: Zustand

## Project Structure
```
src/
  main/           # Electron main process (Node.js)
    index.ts      # Main entry, BrowserWindow setup
    menu.ts       # Native menu (File/Edit/View/Help)
    ipc-handlers.ts
    file-service.ts
    conversion/
      docx-importer.ts    # mammoth.js .docx → HTML
      docx-exporter.ts    # ProseMirror JSON → .docx
      prosemirror-to-docx.ts  # JSON tree walker
      doc-converter.ts    # LibreOffice .doc → .docx
      pdf-exporter.ts     # printToPDF
  preload/        # contextBridge (secure IPC bridge)
    index.ts
    index.d.ts
  renderer/       # React app
    index.html
    src/
      main.tsx
      App.tsx
      components/
        DocumentEditor.tsx  # TipTap editor
        PdfViewer.tsx
        Toolbar.tsx
        TabBar.tsx
        StatusBar.tsx
        WelcomeScreen.tsx
      hooks/
        useFileOperations.ts
      store/
        document-store.ts   # Zustand store
```

## Commands
- `pnpm dev` — Start dev mode with hot reload
- `pnpm build` — Build for production
- `pnpm build:win` — Package for Windows (NSIS installer + portable)

## Conversion Pipeline
- **Import:** .docx → mammoth.js → HTML → `editor.setContent(html)` → TipTap
- **Export:** TipTap → `editor.getJSON()` → ProseMirror JSON → walk tree → docx library → `Packer.toBuffer()` → .docx

## Known Limitations
- Lossy round-trip: mammoth discards precise Word formatting (margins, page breaks, headers/footers)
- No pagination in editor (TipTap is continuous-flow)
- LibreOffice required for .doc files (~600MB, not bundled)
- PDF is view-only (annotations only, no text editing)
- Images stored as base64 (large docs may be slow)
