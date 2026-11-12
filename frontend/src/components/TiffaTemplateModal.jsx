import { useEffect, useState } from 'react'
import { X, Save, Trash2, RotateCcw, Printer } from 'lucide-react'

const ruleConfigs = {
  'Rule of two': {
    gridCols: 'grid-cols-2',
    count: 4,
    labels: ['A4 CH', 'LVOT VIEW', 'RVOT VIEW', '3VV VIEW'],
  },
  'Rule of three': {
    gridCols: 'grid-cols-3',
    count: 9,
    labels: [
      'ABD SITUS',
      'THORAX SITUS',
      'A4 CH',
      'A4 CH COL',
      'LVOT VIEW',
      'LVOT COL',
      'RVOT VIEW',
      'RVOT COL',
      '3VV VIEW',
    ],
  },
  'Rule of four': {
    gridCols: 'grid-cols-4',
    count: 16,
    labels: [
      'ABD SITUS',
      'THORAX SITUS',
      'A4 CH',
      'A4 CH COL',
      'LVOT VIEW',
      'LVOT COL',
      'RVOT VIEW',
      'RVOT COL',
      '3VV VIEW',
      '3VT VIEW',
      'IVC VIEW',
      'SVC VIEW',
      'DUCTAL ARCH',
      'AORTIC ARCH',
      'SAGITTAL',
      'TRANSVERSE',
    ],
  },
}

export default function TiffaTemplateModal({
  open,
  onClose,
  patient,
  visitDate = '02/09/2025 10:42:46 AM',
  images = [],
  initialRuleMode = 'Rule of three',
}) {
  const [ruleMode, setRuleMode] = useState(initialRuleMode)
  const [templateName, setTemplateName] = useState('FETAL ECHO')
  const [columns, setColumns] = useState('1')
  const [width, setWidth] = useState('600')
  const [height, setHeight] = useState('450')
  const [rowsCols, setRowsCols] = useState('4X2')
  const [activeSlot, setActiveSlot] = useState(0)

  const currentConfig = ruleConfigs[ruleMode] || ruleConfigs['Rule of three']
  const [placements, setPlacements] = useState(() => Array(currentConfig.count).fill(null))

  useEffect(() => {
    if (initialRuleMode) {
      setRuleMode(initialRuleMode)
    }
  }, [initialRuleMode])

  useEffect(() => {
    const cfg = ruleConfigs[ruleMode] || ruleConfigs['Rule of three']
    setPlacements(Array(cfg.count).fill(null))
    setActiveSlot(0)
  }, [ruleMode])

  if (!open) return null

  const patientName = patient
    ? [patient.salutation, patient.first_name, patient.last_name].filter(Boolean).join(' ') ||
      patient.patient_id ||
      'Testecho(test)'
    : 'Testecho(test)'

  const placeImage = (img) => {
    const next = [...placements]
    next[activeSlot] = img
    setPlacements(next)
    setActiveSlot(Math.min(activeSlot + 1, placements.length - 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-2xs">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-900">
            TIFFA - Targeted Imaging For Fetal Anomalies - Patient: <span className="font-bold">{patientName}</span> Visit# 1 on {visitDate}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-300 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Action Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <button type="button" className="legacy-small-button">
              <Save className="mr-1 h-3.5 w-3.5 text-teal-700" /> Save
            </button>
            <button type="button" onClick={() => setPlacements(Array(currentConfig.count).fill(null))} className="legacy-small-button">
              <Trash2 className="mr-1 h-3.5 w-3.5 text-red-600" /> Delete
            </button>
            <button type="button" onClick={() => setPlacements(Array(currentConfig.count).fill(null))} className="legacy-small-button">
              <RotateCcw className="mr-1 h-3.5 w-3.5 text-slate-600" /> Clear
            </button>
            <button type="button" className="legacy-small-button">
              <Printer className="mr-1 h-3.5 w-3.5 text-teal-700" /> Preview
            </button>
            <button type="button" onClick={onClose} className="legacy-small-button">
              <X className="mr-1 h-3.5 w-3.5 text-slate-600" /> Close
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span>Tips: Double click to place selected images into template (or) Drag and drop into template</span>
          </div>
        </div>

        {/* Template Controls Bar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Rule Selector (Rule of 2, Rule of 3, Rule of 4) */}
            <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1 shadow-2xs">
              {['Rule of two', 'Rule of three', 'Rule of four'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRuleMode(mode)}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                    ruleMode === mode
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 font-semibold text-slate-700">
              <span>Template name</span>
              <select
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
              >
                <option value="FETAL ECHO">FETAL ECHO</option>
                <option value="Standard TIFFA 9-View">Standard TIFFA 9-View</option>
                <option value="Fetal Heart 4-View">Fetal Heart 4-View</option>
                <option value="Outflow Tracts 3-View">Outflow Tracts 3-View</option>
              </select>
            </label>

            <button type="button" onClick={() => setPlacements(Array(currentConfig.count).fill(null))} className="legacy-small-button">
              Clear image
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            <span className="font-semibold text-slate-600">Print:</span>
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
              <option value="3X2">3X2</option>
            </select>
          </div>
        </div>

        {/* Main Body */}
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px] gap-3 bg-slate-50 p-3">
          {/* Left Panel: Template Frame Grid */}
          <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-2xs overflow-auto">
            <div className={`grid flex-1 ${currentConfig.gridCols} gap-2 min-h-0`}>
              {placements.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSlot(idx)}
                  className={`flex aspect-4/3 flex-col items-center justify-between rounded-lg border-2 p-1.5 transition cursor-pointer overflow-hidden ${
                    activeSlot === idx
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  <div className="flex flex-1 w-full items-center justify-center overflow-hidden rounded bg-slate-50">
                    {img ? (
                      <img src={img} alt={`Frame ${idx + 1}`} className="h-full w-full object-cover rounded" />
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Unassigned</span>
                    )}
                  </div>
                  <span className="mt-1 text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                    {currentConfig.labels[idx] || `View ${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 text-center text-xs font-bold text-slate-700">
              Template name: {templateName} ({ruleMode})
            </div>
          </div>

          {/* Right Panel: Image List */}
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
              Image list
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto space-y-2">
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <div
                    key={idx}
                    onDoubleClick={() => placeImage(img)}
                    onClick={() => placeImage(img)}
                    className="cursor-pointer rounded border border-slate-200 bg-slate-50 p-1 hover:border-teal-500"
                  >
                    <img src={img} alt={`List item ${idx}`} className="h-24 w-full object-cover rounded" />
                    <span className="block truncate text-[10px] text-slate-500 mt-1">Image {idx + 1}</span>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-slate-400 p-4">
                  Double click images to assign to active frame
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
