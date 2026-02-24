import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useCallback, useRef, useState } from 'react'

export default function ResizableImage({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width } = node.attrs
  const imgRef = useRef<HTMLImageElement>(null)
  const [resizing, setResizing] = useState(false)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setResizing(true)

      const startX = e.clientX
      const startWidth = imgRef.current?.offsetWidth || width || 300

      const onMouseMove = (ev: MouseEvent) => {
        const diff = ev.clientX - startX
        const newWidth = Math.max(50, startWidth + diff)
        updateAttributes({ width: newWidth })
      }

      const onMouseUp = () => {
        setResizing(false)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [width, updateAttributes]
  )

  return (
    <NodeViewWrapper className="relative inline-block" data-drag-handle>
      <div
        className={`relative inline-block group ${selected ? 'ring-2 ring-blue-400 rounded' : ''}`}
        style={{ width: width ? `${width}px` : undefined }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          className="block max-w-full h-auto"
          style={{ width: width ? `${width}px` : undefined }}
          draggable={false}
        />
        {/* Resize handle */}
        <div
          className={`absolute bottom-0 right-0 w-4 h-4 cursor-se-resize ${
            selected || resizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onMouseDown={onMouseDown}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4 text-blue-500">
            <path
              d="M14 14H10M14 14V10M14 14L8 8M14 6V2M14 2H10M14 2L8 8M6 14H2M2 14V10M2 14L8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
