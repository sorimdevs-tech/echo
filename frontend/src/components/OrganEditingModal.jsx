import { useRef, useState } from 'react'
import { X, Square, Scissors, Copy, Eraser, Circle, Target, RotateCcw, Redo2, Paintbrush, Pencil, Type, Upload } from 'lucide-react'

export default function OrganEditingModal({ open, onClose }) {
  const canvasRef = useRef(null)
  const [tool, setTool] = useState('Brush')
  const [brushSize, setBrushSize] = useState(3)
  const [eraserSize, setEraserSize] = useState(10)
  const [isDrawing, setIsDrawing] = useState(false)
  const [stampName, setStampName] = useState('')

  if (!open) return null

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleMouseMove = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'Eraser') {
      ctx.clearRect(x - eraserSize / 2, y - eraserSize / 2, eraserSize, eraserSize)
    } else {
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#0284c7'
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-2xs">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-[#387aa4] shadow-2xl">
        {/* Modal Window Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-400 bg-[#295c7e] px-4 py-2 text-white">
          <h2 className="text-sm font-semibold tracking-wide">Organ editing</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-200 hover:bg-slate-700 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tool Icons Toolbar (Dark Blue) */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-400 bg-[#2f6a91] px-4 py-2 text-white text-xs">
          <div className="flex items-center gap-2">
            {[
              { id: 'Select', icon: Square },
              { id: 'Marquee', icon: Square },
              { id: 'Cut', icon: Scissors },
              { id: 'Copy', icon: Copy },
              { id: 'Eraser', icon: Eraser },
              { id: 'Circle', icon: Circle },
              { id: 'Target', icon: Target },
              { id: 'Brush', icon: Paintbrush },
              { id: 'Pencil', icon: Pencil },
              { id: 'Text', icon: Type },
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTool(id)}
                className={`rounded p-1.5 transition ${
                  tool === id ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-100 hover:bg-[#387aa4]'
                }`}
                title={id}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}

            <div className="h-4 w-px bg-slate-400 mx-1" />

            <button type="button" className="flex items-center gap-1 rounded bg-[#295c7e] px-2 py-1 hover:bg-[#204762]">
              <RotateCcw className="h-3.5 w-3.5" /> Undo
            </button>
            <button type="button" className="flex items-center gap-1 rounded bg-[#295c7e] px-2 py-1 hover:bg-[#204762]">
              <Redo2 className="h-3.5 w-3.5" /> Redo
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium">Brush Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="h-1.5 w-24 cursor-pointer rounded-lg bg-slate-300 accent-teal-300"
            />
          </div>
        </div>

        {/* Main Body */}
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_260px] overflow-hidden p-3 gap-3 bg-[#387aa4]">
          {/* Left Canvas Area */}
          <div className="flex flex-col rounded-lg border border-slate-300 bg-[#295c7e] p-2 shadow-inner">
            <div className="flex-1 overflow-hidden rounded bg-white relative">
              <canvas
                ref={canvasRef}
                width={700}
                height={500}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="h-full w-full cursor-crosshair bg-white"
              />
            </div>

            {/* Bottom Size Pickers */}
            <div className="mt-2 flex items-center justify-between rounded bg-[#204762] px-3 py-2 text-white text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Pick brush size</span>
                <div className="flex items-center gap-1.5">
                  {[2, 4, 6, 8, 10, 14, 18, 22].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setBrushSize(sz)}
                      style={{ width: `${sz + 4}px`, height: `${sz + 4}px` }}
                      className={`rounded-full bg-slate-100 hover:bg-teal-300 transition ${
                        brushSize === sz ? 'ring-2 ring-teal-300 ring-offset-1 ring-offset-[#204762]' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">Pick erase pointer size</span>
                <div className="flex items-center gap-1.5">
                  {[6, 10, 14, 18, 24, 30].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setEraserSize(sz)}
                      style={{ width: `${sz / 2 + 8}px`, height: `${sz / 2 + 8}px` }}
                      className={`rounded-full border border-white hover:bg-slate-300 transition ${
                        eraserSize === sz ? 'bg-white' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Organ list & Stamps */}
          <div className="flex flex-col gap-3 rounded-lg border border-slate-300 bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800">Organ list</span>
              <button type="button" className="legacy-small-button text-[11px]">
                <Upload className="mr-1 h-3 w-3" /> Import master
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-400">
              No organ masters imported
            </div>

            <div className="shrink-0 space-y-2 border-t border-slate-200 pt-2 text-xs">
              <div className="font-semibold text-slate-700">Stamp list</div>
              <div className="h-20 rounded border border-slate-200 bg-slate-50 p-2 text-slate-400">
                No stamps
              </div>

              <label className="field-label">
                Stamp name
                <input
                  type="text"
                  value={stampName}
                  onChange={(e) => setStampName(e.target.value)}
                  className="legacy-input h-7 text-xs"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
