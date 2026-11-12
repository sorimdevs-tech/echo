import { useEffect, useState } from 'react'
import { workspaceService } from '../api/workspaceService'
import MediaPrintPreview from './MediaPrintPreview'
import UnsavedChangesPrompt from './UnsavedChangesPrompt'
import { X, Save, Trash2, Printer } from 'lucide-react'

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

const kindFor = (mode) => ({ 'Rule of two': 'rule-2', 'Rule of three': 'rule-3', 'Rule of four': 'rule-4' }[mode])
const defaultPrintSettings = { columns: '1', width: '600', height: '450', rows: '4' }

const layoutSnapshot = (state) => JSON.stringify(state)

const printSettingsValid = (width, height, rows) => {
  const parsedWidth = Number(width)
  const parsedHeight = Number(height)
  const parsedRows = Number(rows)
  return Number.isInteger(parsedWidth) && parsedWidth >= 60 && parsedWidth <= 1200 &&
    Number.isInteger(parsedHeight) && parsedHeight >= 60 && parsedHeight <= 1200 &&
    [3, 4].includes(parsedRows)
}

export default function TiffaTemplateModal({
  open,
  onClose,
  patient,
  visitDate = '',
  visitId = '',
  mediaRecords = [],
  images = [],
  initialRuleMode = 'Rule of three',
}) {
  const [ruleMode, setRuleMode] = useState(initialRuleMode)
  const [templateName, setTemplateName] = useState('FETAL ECHO')
  const [columns, setColumns] = useState(defaultPrintSettings.columns)
  const [width, setWidth] = useState(defaultPrintSettings.width)
  const [height, setHeight] = useState(defaultPrintSettings.height)
  const [rows, setRows] = useState(defaultPrintSettings.rows)
  const [activeSlot, setActiveSlot] = useState(0)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)

  const currentConfig = ruleConfigs[ruleMode] || ruleConfigs['Rule of three']
  const [placements, setPlacements] = useState(() => Array(currentConfig.count).fill(null))

  const currentSnapshot = layoutSnapshot({ placements, templateName, columns, width, height, rows })
  const dirty = savedSnapshot !== null && currentSnapshot !== savedSnapshot
  const settingsValid = printSettingsValid(width, height, rows)

  useEffect(() => {
    if (initialRuleMode) setRuleMode(initialRuleMode)
  }, [initialRuleMode])

  useEffect(() => {
    let active = true
    const cfg = ruleConfigs[ruleMode] || ruleConfigs['Rule of three']
    setPlacements(Array(cfg.count).fill(null))
    setActiveSlot(0)
    setPreview(false); setReady(false)
    setSavedSnapshot(null); setPendingAction(null)
    if (open && patient?.id && visitId) {
      setBusy(true)
      workspaceService.getMediaLayout(patient.id, visitId, kindFor(ruleMode)).then(result => {
        if (!active) return
        const layout = result.data
        const nextPlacements = Array.from({ length: cfg.count }, (_, index) =>
          mediaRecords.find(item => item.id === layout?.placements[index] && item.status !== 'Archived')?.url || null
        )
        const nextName = layout?.title || 'FETAL ECHO'
        const nextColumns = ['1', '2'].includes(String(layout?.columns)) ? String(layout.columns) : defaultPrintSettings.columns
        const nextWidth = String(layout?.print_settings?.width ?? defaultPrintSettings.width)
        const nextHeight = String(layout?.print_settings?.height ?? defaultPrintSettings.height)
        const nextRows = ['3', '4'].includes(String(layout?.print_settings?.rows)) ? String(layout.print_settings.rows) : defaultPrintSettings.rows
        setPlacements(nextPlacements)
        setTemplateName(nextName)
        setColumns(nextColumns)
        setWidth(nextWidth)
        setHeight(nextHeight)
        setRows(nextRows)
        setSavedSnapshot(layoutSnapshot({ placements: nextPlacements, templateName: nextName, columns: nextColumns, width: nextWidth, height: nextHeight, rows: nextRows }))
        setReady(true)
        setMessage(layout ? 'Saved layout loaded.' : 'Choose images and save this visit layout.')
      }).catch(() => { if (active) setMessage('Unable to load layout. Close and retry before saving.') })
        .finally(() => { if (active) setBusy(false) })
    }
    return () => { active = false }
  }, [ruleMode, open, patient?.id, visitId, mediaRecords])

  const saveLayout = async () => {
    if (!ready || busy || !settingsValid) return false
    setBusy(true)
    try {
      const ids = placements.map(url => url ? mediaRecords.find(item => item.url === url)?.id : null)
      if (ids.some(id => id === undefined)) throw new Error('Save the source images to this visit before saving the layout.')
      await workspaceService.saveMediaLayout(patient.id, visitId, kindFor(ruleMode), {
        title: templateName,
        columns: Number(columns),
        print_settings: { width: Number(width), height: Number(height), rows: Number(rows) },
        placements: ids,
      })
      setSavedSnapshot(currentSnapshot)
      setMessage('Layout saved to this patient visit.')
      return true
    } catch (error) {
      setMessage(error.response?.data?.detail || error.message || 'Layout save failed.')
      return false
    } finally { setBusy(false) }
  }

  const requestClose = () => {
    if (busy) return
    if (dirty) { setPendingAction({ type: 'close' }); return }
    onClose()
  }

  const requestRuleChange = (mode) => {
    if (mode === ruleMode || busy) return
    if (dirty) { setPendingAction({ type: 'rule', mode }); return }
    setRuleMode(mode)
  }

  const completePending = () => {
    const action = pendingAction
    setPendingAction(null)
    if (!action) return
    if (action.type === 'rule') setRuleMode(action.mode)
    else onClose()
  }

  const saveAndContinue = async () => {
    if (await saveLayout()) completePending()
  }

  if (!open) return null

  const patientName = patient
    ? [patient.salutation, patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.patient_id || 'Select patient'
    : 'Select patient'

  const placeImage = (img) => {
    const next = [...placements]
    next[activeSlot] = img
    setPlacements(next)
    setActiveSlot(Math.min(activeSlot + 1, placements.length - 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-2xs" role="dialog" aria-modal="true" aria-label="Image layout">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-900">
            Image layout — Patient: <span className="font-bold">{patientName}</span> · Visit# {visitId || '—'} {visitDate}
          </h2>
          <button type="button" onClick={requestClose} className="rounded p-1 text-slate-500 hover:bg-slate-300 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Action Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <button type="button" disabled={busy || !ready || !settingsValid} onClick={saveLayout} className="legacy-small-button">
              <Save className="mr-1 h-3.5 w-3.5 text-teal-700" /> Save
            </button>
            <button type="button" disabled={busy} onClick={() => setPlacements(Array(currentConfig.count).fill(null))} className="legacy-small-button">
              <Trash2 className="mr-1 h-3.5 w-3.5 text-red-600" /> Clear layout
            </button>
            <button type="button" disabled={!placements.some(Boolean) || !settingsValid} onClick={() => setPreview(true)} className="legacy-small-button">
              <Printer className="mr-1 h-3.5 w-3.5 text-teal-700" /> Preview
            </button>
            <button type="button" onClick={requestClose} className="legacy-small-button">
              <X className="mr-1 h-3.5 w-3.5 text-slate-600" /> Close
            </button>
            {dirty && <span className="text-amber-600 font-semibold">Unsaved changes</span>}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span>Click once to place an image in the active frame.</span>
          </div>
        </div>

        <p role="status" className="px-4 py-2 text-sm">{busy ? 'Loading/saving layout…' : message}</p>

        {/* Template Controls Bar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Rule Selector */}
            <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1 shadow-2xs">
              {['Rule of two', 'Rule of three', 'Rule of four'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => requestRuleChange(mode)}
                  disabled={busy}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition ${ruleMode === mode ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
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
                disabled={busy}
                onChange={(e) => setTemplateName(e.target.value)}
                className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
              >
                <option value="FETAL ECHO">FETAL ECHO</option>
                <option value="Standard TIFFA 9-View">Standard TIFFA 9-View</option>
                <option value="Fetal Heart 4-View">Fetal Heart 4-View</option>
                <option value="Outflow Tracts 3-View">Outflow Tracts 3-View</option>
              </select>
            </label>

            <button type="button" disabled={busy} onClick={() => setPlacements(Array(currentConfig.count).fill(null))} className="legacy-small-button">
              Clear images
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            <span className="font-semibold text-slate-600">Print:</span>
            <label className="flex items-center gap-1">
              <span>Images per row</span>
              <select value={columns} disabled={busy} onChange={(e) => setColumns(e.target.value)} className="h-7 rounded border border-slate-300 px-1 text-xs">
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span>Width (px)</span>
              <input type="number" min="60" max="1200" step="10" disabled={busy} value={width} onChange={(e) => setWidth(e.target.value)} aria-label="Print image width in pixels" className="h-7 w-16 rounded border border-slate-300 text-center text-xs" />
            </label>
            <label className="flex items-center gap-1">
              <span>Height (px)</span>
              <input type="number" min="60" max="1200" step="10" disabled={busy} value={height} onChange={(e) => setHeight(e.target.value)} aria-label="Print image height in pixels" className="h-7 w-16 rounded border border-slate-300 text-center text-xs" />
            </label>
            <label className="flex items-center gap-1">
              <span>Rows per page</span>
              <select value={rows} disabled={busy} onChange={(e) => setRows(e.target.value)} className="h-7 rounded border border-slate-300 px-1 text-xs">
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </label>
            {!settingsValid && <span className="text-red-600">Width and height must be 60–1200 px.</span>}
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
                  className={`flex aspect-4/3 flex-col items-center justify-between rounded-lg border-2 p-1.5 transition cursor-pointer overflow-hidden ${activeSlot === idx
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
              Template: {templateName} ({ruleMode})
            </div>
          </div>

          {/* Right Panel: Image List */}
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">Image list</div>
            <div className="min-h-0 flex-1 overflow-y-auto space-y-2">
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={(event) => { if (event.detail <= 1) placeImage(img) }}
                    className="cursor-pointer rounded border border-slate-200 bg-slate-50 p-1 hover:border-teal-500"
                  >
                    <img src={img} alt={`List item ${idx}`} className="h-24 w-full object-cover rounded" />
                    <span className="block truncate text-[10px] text-slate-500 mt-1">Image {idx + 1}</span>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-slate-400 p-4">
                  Click images to assign them to the active frame.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {preview && (
        <MediaPrintPreview
          images={placements}
          columns={Number(columns)}
          rows={Number(rows)}
          imageWidth={Number(width)}
          imageHeight={Number(height)}
          title={templateName}
          patientId={patient?.patient_id}
          patientName={patientName}
          visitId={visitId}
          visitDate={visitDate}
          onClose={() => setPreview(false)}
        />
      )}
      <UnsavedChangesPrompt
        open={Boolean(pendingAction)}
        title="Unsaved image layout"
        message={pendingAction?.type === 'rule'
          ? 'Changing the layout rule discards image placements and print settings that are not saved to this visit.'
          : 'This image layout has changes that are not saved to this visit.'}
        saveLabel="Save and continue"
        saving={busy}
        saveDisabled={!ready || !settingsValid}
        onSave={saveAndContinue}
        onDiscard={completePending}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  )
}
