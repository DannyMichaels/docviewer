import { useRef, useState, useCallback, useEffect } from 'react'
import { Pen, Upload, Trash2, Check, X, Type } from 'lucide-react'

interface SignatureModalProps {
  onSave: (dataUrl: string) => void
  onClose: () => void
}

export default function SignatureModal({ onSave, onClose }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [mode, setMode] = useState<'draw' | 'upload' | 'type'>('draw')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [typedName, setTypedName] = useState('')
  const [typedFont, setTypedFont] = useState('Dancing Script')
  const typedCanvasRef = useRef<HTMLCanvasElement>(null)

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a1a1a'
  }, [])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height)
    }
  }

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    setHasDrawn(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [])

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      const { x, y } = getPos(e)
      ctx.lineTo(x, y)
      ctx.stroke()
    },
    [isDrawing]
  )

  const stopDraw = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        setUploadedImage(reader.result as string)
        setMode('upload')
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  // Render typed name to canvas and return dataUrl
  const renderTypedSignature = async (): Promise<string | null> => {
    const canvas = typedCanvasRef.current
    if (!canvas || !typedName.trim()) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Ensure the font is loaded before rendering
    try {
      await document.fonts.load(`48px "${typedFont}"`)
    } catch {
      // proceed with fallback cursive
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#1a1a1a'
    ctx.font = `48px "${typedFont}", cursive`
    ctx.textBaseline = 'middle'
    ctx.fillText(typedName, 16, canvas.height / 2)
    return canvas.toDataURL('image/png')
  }

  const handleSave = async () => {
    if (mode === 'upload' && uploadedImage) {
      onSave(uploadedImage)
    } else if (mode === 'draw' && canvasRef.current && hasDrawn) {
      onSave(canvasRef.current.toDataURL('image/png'))
    } else if (mode === 'type' && typedName.trim()) {
      const dataUrl = await renderTypedSignature()
      if (dataUrl) onSave(dataUrl)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          width: 520,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e8e8e8'
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>Add Signature</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: 4
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8' }}>
          <button
            type="button"
            onClick={() => setMode('draw')}
            style={{
              flex: 1,
              padding: '10px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              background: mode === 'draw' ? '#faf5ff' : 'transparent',
              color: mode === 'draw' ? '#7c3aed' : '#6b7280',
              border: 'none',
              borderBottom: mode === 'draw' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            <Pen size={14} />
            Draw
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            style={{
              flex: 1,
              padding: '10px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              background: mode === 'type' ? '#faf5ff' : 'transparent',
              color: mode === 'type' ? '#7c3aed' : '#6b7280',
              border: 'none',
              borderBottom: mode === 'type' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            <Type size={14} />
            Type
          </button>
          <button
            type="button"
            onClick={handleUpload}
            style={{
              flex: 1,
              padding: '10px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              background: mode === 'upload' ? '#faf5ff' : 'transparent',
              color: mode === 'upload' ? '#7c3aed' : '#6b7280',
              border: 'none',
              borderBottom: mode === 'upload' ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            <Upload size={14} />
            Upload Image
          </button>
        </div>

        {/* Load cursive fonts */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Sacramento&family=Pacifico&display=swap');
        `}</style>

        {/* Canvas / Preview */}
        <div style={{ padding: 20 }}>
          {mode === 'type' ? (
            <div>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your name..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  outline: 'none',
                  marginBottom: 12,
                  boxSizing: 'border-box'
                }}
              />
              {/* Font selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {['Dancing Script', 'Great Vibes', 'Sacramento', 'Pacifico'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTypedFont(f)}
                    style={{
                      padding: '6px 14px',
                      fontSize: 16,
                      fontFamily: `"${f}", cursive`,
                      border: typedFont === f ? '2px solid #7c3aed' : '1px solid #d1d5db',
                      borderRadius: 8,
                      background: typedFont === f ? '#faf5ff' : '#fff',
                      cursor: 'pointer',
                      color: '#111'
                    }}
                  >
                    {typedName || 'Signature'}
                  </button>
                ))}
              </div>
              {/* Preview */}
              <div
                style={{
                  border: '1px dashed #d1d5db',
                  borderRadius: 8,
                  background: '#fafafa',
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <span
                  style={{
                    fontFamily: `"${typedFont}", cursive`,
                    fontSize: 42,
                    color: '#1a1a1a',
                    userSelect: 'none'
                  }}
                >
                  {typedName || <span style={{ color: '#c4c4c4' }}>Preview</span>}
                </span>
              </div>
              {/* Hidden canvas for rendering */}
              <canvas ref={typedCanvasRef} width={480} height={100} style={{ display: 'none' }} />
            </div>
          ) : mode === 'draw' ? (
            <div
              style={{
                border: '1px dashed #d1d5db',
                borderRadius: 8,
                background: '#fafafa',
                position: 'relative'
              }}
            >
              <canvas
                ref={canvasRef}
                width={480}
                height={180}
                style={{ width: '100%', height: 180, cursor: 'crosshair', display: 'block' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
              />
              {!hasDrawn && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c4c4c4',
                    fontSize: 14,
                    pointerEvents: 'none'
                  }}
                >
                  Draw your signature here
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                border: '1px dashed #d1d5db',
                borderRadius: 8,
                background: '#fafafa',
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {uploadedImage ? (
                <img
                  src={uploadedImage}
                  alt="Signature"
                  style={{ maxHeight: 160, maxWidth: '90%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ color: '#c4c4c4', fontSize: 14 }}>Click "Upload Image" to select a file</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 20px 16px',
            borderTop: '1px solid #e8e8e8'
          }}
        >
          <button
            type="button"
            onClick={() => {
              clearCanvas()
              setUploadedImage(null)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontSize: 13,
              color: '#6b7280',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            <Trash2 size={14} />
            Clear
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={mode === 'draw' ? !hasDrawn : mode === 'type' ? !typedName.trim() : !uploadedImage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 500,
              color: '#fff',
              background:
                (mode === 'draw' ? hasDrawn : mode === 'type' ? typedName.trim() : uploadedImage)
                  ? '#7c3aed'
                  : '#c4b5fd',
              border: 'none',
              borderRadius: 8,
              cursor:
                (mode === 'draw' ? hasDrawn : mode === 'type' ? typedName.trim() : uploadedImage)
                  ? 'pointer'
                  : 'not-allowed'
            }}
          >
            <Check size={14} />
            Place Signature
          </button>
        </div>
      </div>
    </div>
  )
}
