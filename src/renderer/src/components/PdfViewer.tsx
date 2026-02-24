import { useState, useCallback, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  PenLine,
  Download
} from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import SignatureModal from './SignatureModal'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export interface PdfSignature {
  id: string
  page: number
  x: number // percentage from left
  y: number // percentage from top
  width: number // percentage of page width
  dataUrl: string
}

interface PdfViewerProps {
  data: string
  signatures?: PdfSignature[]
  onSignaturesChange?: (sigs: PdfSignature[]) => void
}

export default function PdfViewer({ data, signatures = [], onSignaturesChange }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [rotation, setRotation] = useState(0)
  const [showSignModal, setShowSignModal] = useState(false)
  const [placing, setPlacing] = useState<string | null>(null) // signature dataUrl being placed
  const [dragging, setDragging] = useState<string | null>(null) // id of signature being dragged
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const pageRef = useRef<HTMLDivElement>(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setCurrentPage(1)
  }, [])

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage((p) => Math.min(numPages, p + 1))
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.2))
  const zoomOut = () => setScale((s) => Math.max(0.4, s - 0.2))
  const rotate = () => setRotation((r) => (r + 90) % 360)
  const fitWidth = () => setScale(1.2)

  const pdfData = `data:application/pdf;base64,${data}`

  const pageSigs = signatures.filter((s) => s.page === currentPage)

  // Place a new signature on click
  const handlePageClick = (e: React.MouseEvent) => {
    if (!placing || !pageRef.current) return

    const rect = pageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newSig: PdfSignature = {
      id: `sig-${Date.now()}`,
      page: currentPage,
      x,
      y,
      width: 20, // 20% of page width default
      dataUrl: placing
    }

    onSignaturesChange?.([...signatures, newSig])
    setPlacing(null)
  }

  // Drag existing signature
  const handleSigMouseDown = (e: React.MouseEvent, sig: PdfSignature) => {
    e.stopPropagation()
    if (!pageRef.current) return
    const rect = pageRef.current.getBoundingClientRect()
    const mouseXPct = ((e.clientX - rect.left) / rect.width) * 100
    const mouseYPct = ((e.clientY - rect.top) / rect.height) * 100
    setDragging(sig.id)
    setDragOffset({ x: mouseXPct - sig.x, y: mouseYPct - sig.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !pageRef.current) return
    const rect = pageRef.current.getBoundingClientRect()
    const mouseXPct = ((e.clientX - rect.left) / rect.width) * 100
    const mouseYPct = ((e.clientY - rect.top) / rect.height) * 100

    const updated = signatures.map((s) =>
      s.id === dragging ? { ...s, x: mouseXPct - dragOffset.x, y: mouseYPct - dragOffset.y } : s
    )
    onSignaturesChange?.(updated)
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  const deleteSig = (id: string) => {
    onSignaturesChange?.(signatures.filter((s) => s.id !== id))
  }

  const handleSignatureSave = (dataUrl: string) => {
    setShowSignModal(false)
    setPlacing(dataUrl)
  }

  // Export PDF with signatures baked in via IPC
  const handleExportSigned = async () => {
    if (signatures.length === 0) return
    await window.api.exportPdf({ defaultPath: 'signed-document.pdf', html: '' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* PDF Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          background: '#f9fafb',
          borderBottom: '1px solid #e8e8e8'
        }}
      >
        <button type="button" onClick={goToPrev} disabled={currentPage <= 1} className="toolbar-btn" title="Previous page">
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: 13, color: '#6b7280', minWidth: 70, textAlign: 'center' }}>
          {currentPage} / {numPages}
        </span>
        <button type="button" onClick={goToNext} disabled={currentPage >= numPages} className="toolbar-btn" title="Next page">
          <ChevronRight size={18} />
        </button>

        <div className="toolbar-divider" />

        <button type="button" onClick={zoomOut} className="toolbar-btn" title="Zoom out">
          <ZoomOut size={18} />
        </button>
        <span style={{ fontSize: 13, color: '#6b7280', minWidth: 45, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        <button type="button" onClick={zoomIn} className="toolbar-btn" title="Zoom in">
          <ZoomIn size={18} />
        </button>
        <button type="button" onClick={fitWidth} className="toolbar-btn" title="Fit width">
          <Maximize size={18} />
        </button>
        <button type="button" onClick={rotate} className="toolbar-btn" title="Rotate">
          <RotateCw size={18} />
        </button>

        <div className="toolbar-divider" />

        <button
          type="button"
          onClick={() => setShowSignModal(true)}
          className={`toolbar-btn ${placing ? 'active' : ''}`}
          title="Add Signature"
          style={{ gap: 4, width: 'auto', padding: '0 10px', fontSize: 13, fontWeight: 500 }}
        >
          <PenLine size={16} />
          Sign
        </button>

        {placing && (
          <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
            Click on the page to place signature
          </span>
        )}
      </div>

      {/* PDF Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          background: '#e5e5e5',
          padding: 24
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={pageRef}
          style={{ position: 'relative', cursor: placing ? 'crosshair' : 'default' }}
          onClick={handlePageClick}
        >
          <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess} loading={<LoadingSpinner />}>
            <Page
              pageNumber={currentPage}
              scale={scale}
              rotate={rotation}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>

          {/* Signature overlays */}
          {pageSigs.map((sig) => (
            <div
              key={sig.id}
              style={{
                position: 'absolute',
                left: `${sig.x}%`,
                top: `${sig.y}%`,
                width: `${sig.width}%`,
                cursor: dragging === sig.id ? 'grabbing' : 'grab',
                userSelect: 'none',
                zIndex: 10
              }}
              onMouseDown={(e) => handleSigMouseDown(e, sig)}
            >
              <img
                src={sig.dataUrl}
                alt="Signature"
                style={{ width: '100%', pointerEvents: 'none' }}
                draggable={false}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSig(sig.id)
                }}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {showSignModal && (
        <SignatureModal onSave={handleSignatureSave} onClose={() => setShowSignModal(false)} />
      )}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid #e5e7eb',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
