import { useState } from 'react'
import { X, Save, Trash2, Printer, Download, RefreshCw, Image as ImageIcon } from 'lucide-react'

export default function ImageCompareModal({ open, onClose, images = [] }) {
  const [comparedImages, setComparedImages] = useState([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [columns, setColumns] = useState('1')
  const [width, setWidth] = useState('600')
  const [height, setHeight] = useState('450')
  const [rowsCols, setRowsCols] = useState('4X2')
  const [anonymous, setAnonymous] = useState(true)

  if (!open) return null

  const handleSelectImage = (img) => {
    if (!comparedImages.includes(img)) {
      setComparedImages([...comparedImages, img])
    }
  }

  const handleRemoveImage = (img) => {
    setComparedImages(comparedImages.filter((i) => i !== img))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-2xs">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-900">Image Comparison</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-300 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Controls & Print Options Bar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 font-medium text-slate-700">
              <span>List of visits</span>
              <select className="h-7 rounded border border-slate-300 bg-white px-2 text-xs">
                <option>02/09/2025 10:42:46 AM</option>
              </select>
            </label>
            <button type="button" className="legacy-small-button">4 Image Per Row</button>
            <button type="button" onClick={() => setComparedImages([])} className="legacy-small-button">Clear image</button>
            <button type="button" className="legacy-small-button">Save</button>
            <button type="button" className="legacy-small-button">Delete</button>
            <button type="button" onClick={() => setComparedImages([])} className="legacy-small-button">Clear</button>
            <button type="button" className="legacy-small-button">Print</button>
            <button type="button" className="legacy-small-button">Export</button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            <span className="font-semibold text-slate-600">Print Options:</span>
            <select value={columns} onChange={(e) => setColumns(e.target.value)} className="h-7 rounded border border-slate-300 px-1 text-xs">
              <option value="1">Images: 1 column per row</option>
              <option value="2">Images: 2 column per row</option>
            </select>
            <span>Width:</span>
            <input value={width} onChange={(e) => setWidth(e.target.value)} className="h-7 w-12 rounded border border-slate-300 text-center text-xs" />
            <span>Height:</span>
            <input value={height} onChange={(e) => setHeight(e.target.value)} className="h-7 w-12 rounded border border-slate-300 text-center text-xs" />
            <span>Rows X Cols</span>
            <select value={rowsCols} onChange={(e) => setRowsCols(e.target.value)} className="h-7 rounded border border-slate-300 px-1 text-xs">
              <option value="4X2">4X2</option>
              <option value="2X2">2X2</option>
            </select>
            <label className="flex items-center gap-1 font-medium text-slate-700 ml-1">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Anonymous images
            </label>
          </div>
        </div>

        {/* Sub-Header Tips Banner */}
        <div className="grid shrink-0 grid-cols-[300px_1fr] border-b border-slate-200 bg-slate-100 text-xs">
          <div className="border-r border-slate-200 p-2 font-semibold text-slate-700">
            Tips : Double click the image to compare &nbsp;&nbsp; Title
          </div>
          <div className="p-2 font-semibold text-slate-700">
            Tips : Remove image from Comparison - Click "Clear image" button and Double click on the Image
          </div>
        </div>

        {/* Main Comparison Body */}
        <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr] overflow-hidden bg-slate-50 p-2 gap-2">
          {/* Left Panel: Available Images */}
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-2xs">
            <div className="min-h-0 flex-1 overflow-y-auto space-y-2">
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <div
                    key={idx}
                    onDoubleClick={() => handleSelectImage(img)}
                    className="group relative cursor-pointer rounded border border-slate-200 bg-slate-100 p-1 hover:border-teal-500"
                  >
                    <img src={img} alt={`Source ${idx}`} className="h-28 w-full object-cover rounded" />
                    <span className="block text-[10px] text-slate-500 mt-1 truncate">Image {idx + 1}</span>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-slate-400 p-4">
                  Double click images to place in comparison pane
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200 pt-2">
              <label className="field-label text-xs">
                Title
                <input
                  type="text"
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  placeholder="Enter title..."
                  className="legacy-input h-7 text-xs"
                />
              </label>
            </div>
          </div>

          {/* Right Panel: Side by Side Comparison Grid */}
          <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-2xs overflow-auto">
            {comparedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 h-full">
                {comparedImages.map((img, idx) => (
                  <div
                    key={idx}
                    onDoubleClick={() => handleRemoveImage(img)}
                    className="relative flex flex-col rounded-lg border border-slate-300 bg-slate-900 p-2 shadow-xs group"
                  >
                    <img src={img} alt={`Compare ${idx}`} className="flex-1 w-full object-contain rounded" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img)}
                      className="absolute top-2 right-2 rounded bg-slate-900/80 p-1 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="mt-2 text-center text-xs font-medium text-white truncate">
                      Comparison Image #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                <ImageIcon className="mb-2 h-12 w-12 stroke-1 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">Comparison Workspace</p>
                <p className="mt-1 text-xs text-slate-400">Double click images on the left panel to compare them side by side</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
