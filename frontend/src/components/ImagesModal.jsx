import { useCallback, useEffect, useRef, useState } from 'react'
import { workspaceService } from '../api/workspaceService'
import MediaPrintPreview from './MediaPrintPreview'
import { X, RefreshCw, Upload, Download, Trash2, Printer, Send, FileSpreadsheet, Tv, Settings, HardDrive, FileText, Check, Plus, Search } from 'lucide-react'
import ImageCompareModal from './ImageCompareModal'
import OrganEditingModal from './OrganEditingModal'
import TiffaTemplateModal from './TiffaTemplateModal'

export default function ImagesModal({ open, onClose, patient, visitDate = '', visitId = '' }) {
  const [activeTab, setActiveTab] = useState('images')
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [isOrganEditingOpen, setIsOrganEditingOpen] = useState(false)
  const [isTiffaOpen, setIsTiffaOpen] = useState(false)
  const [initialRuleMode, setInitialRuleMode] = useState('Rule of three')
  const [columns, setColumns] = useState('1')
  const [width, setWidth] = useState('600')
  const [height, setHeight] = useState('450')
  const [rowsCols, setRowsCols] = useState('4X2')
  const [exportFormat, setExportFormat] = useState('avi')
  const [videoTitle, setVideoTitle] = useState('')
  const [searchTitle, setSearchTitle] = useState('')
  const [aspectRatio, setAspectRatio] = useState('4:3')
  const [titleName, setTitleName] = useState('')
  const [titleType, setTitleType] = useState('Standard')
  const [aeTitle, setAeTitle] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [port, setPort] = useState('')
  const [description, setDescription] = useState('')

  const [dicomConfigs, setDicomConfigs] = useState([

  ])

  const [spoolerItems, setSpoolerItems] = useState([])
  const [archivedPdfs, setArchivedPdfs] = useState([])
  const [importedImages, setImportedImages] = useState([])
  const [importedVideos, setImportedVideos] = useState([])
  const [records, setRecords] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [printImages, setPrintImages] = useState(null)
  const generation = useRef(0)
  const loadMedia = useCallback(async () => {
    const request = ++generation.current
    setMessage('Loading saved media…')
    try {
      const result = await workspaceService.list('media-records')
      if(request !== generation.current) return
      const scoped = (result.data || []).filter(item => String(item.patient_id) === String(patient?.id) && String(item.visit_id) === String(visitId))
      setRecords(scoped)
      const current = scoped.filter(item => item.status !== 'Archived')
      setImportedImages(current.filter(item => item.type?.startsWith('image/')).map(item => item.url))
      setImportedVideos(current.filter(item => item.type?.startsWith('video/')))
      setArchivedPdfs(current.filter(item => item.type === 'application/pdf').map(item => ({...item,date:item.created_at,size:`${(item.size / 1024).toFixed(1)} KB`})))
      setMessage('Saved media loaded.')
    } catch { if(request === generation.current) setMessage('Unable to load saved media. Refresh to retry.') }
  }, [patient?.id, visitId])
  useEffect(() => {
    setRecords([]);setImportedImages([]);setImportedVideos([]);setArchivedPdfs([]);setPrintImages(null)
    if(open && patient?.id && visitId) loadMedia()
    return () => { generation.current++ }
  }, [open, loadMedia, patient?.id, visitId])

  if (!open) return null

  const patientName = patient
    ? [patient.salutation, patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.patient_id || 'Select patient'
    : 'Select patient'

  const addDicomConfig = () => {
    if (!aeTitle || !ipAddress) return
    setDicomConfigs([...dicomConfigs, { aeTitle, ipAddress, port: port || '104', description }])
    setAeTitle('')
    setIpAddress('')
    setPort('')
    setDescription('')
  }

  const handleImageImport = async (e) => {
    const files = Array.from(e.target.files || []); e.target.value = ''
    if(!patient?.id || !visitId) {setMessage('Save/select a patient visit before importing.');return}
    const request = generation.current
    setBusy(true)
    let saved = 0
    try {
      for(const file of files) {
        const form = new FormData();form.append('file',file);form.append('patient_id',patient.id);form.append('visit_id',visitId)
        await workspaceService.uploadMedia(form);saved++
      }
      if(request === generation.current) {await loadMedia();setMessage(`${saved} file(s) saved to this visit.`)}
    } catch(error) {
      if(request === generation.current) {await loadMedia();setMessage(`${saved} file(s) saved. ${error.response?.data?.detail || 'Import failed. Retry the remaining files.'}`)}
    } finally {setBusy(false)}
  }
  const handlePdfImport = handleImageImport
  const archive = async (urls) => {
    if(!urls.length || busy) return
    setBusy(true)
    try {
      for(const record of records.filter(item => urls.includes(item.url) && item.status !== 'Archived')) await workspaceService.remove('media-records', record.id)
      await loadMedia();setMessage('Media archived. Originals are preserved; use Restore archived images to undo.')
    } catch(error) {await loadMedia();setMessage(error.response?.data?.detail || 'Unable to archive media.')}
    finally {setBusy(false)}
  }
  const restoreImages = async () => {
    setBusy(true)
    try {for(const record of records.filter(item => item.status === 'Archived' && item.type?.startsWith('image/'))) await workspaceService.update('media-records',record.id,{status:'Uploaded'});await loadMedia();setMessage('Archived images restored.')}
    catch(error) {setMessage(error.response?.data?.detail || 'Restore failed. Refresh and retry.')}
    finally {setBusy(false)}
  }
  const exportImages = async () => {
    setBusy(true)
    try {
      for(const record of records.filter(item => importedImages.includes(item.url))) {
        const token = sessionStorage.getItem('echoai_token') || localStorage.getItem('echoai_token')
        const response = await fetch(record.url,{credentials:'same-origin',headers:token?{Authorization:`Bearer ${token}`}:{}})
        if(!response.ok) throw new Error('File download failed.')
        const url = URL.createObjectURL(await response.blob())
        const link = document.createElement('a');link.href=url;link.download=record.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
      }
      setMessage('Original image downloads requested.')
    } catch(error) {setMessage(error.message)} finally {setBusy(false)}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Saved patient media">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
        {/* Modal Window Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-teal-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Images - Patient: <span className="font-bold">{patientName}</span> Visit# {visitId || '—'} {visitDate}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-300 hover:text-slate-900 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="border-b bg-slate-50 p-3 text-sm">Imports are saved to this patient visit. Scanner/PACS transfer and anonymisation are not configured. <a className="underline" href={`/images?patientId=${encodeURIComponent(patient?.id || '')}&visitId=${encodeURIComponent(visitId)}`}>Open saved patient media</a></p>
        <p role="status" aria-live="polite" className="px-4 py-2 text-sm">{busy ? 'Saving media…' : message}</p>
        {/* Top Controls & Print Options Bar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 font-medium text-slate-700">
              <span>List Of Visits</span>
              <select className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 shadow-xs focus:border-teal-500 focus:outline-none">
                <option>{visitDate}</option>
              </select>
            </label>
            <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">
              4 Image Per Row
            </button>
            <button type="button" disabled={busy || !patient?.id || !visitId} onClick={loadMedia} className="legacy-small-button">
              <RefreshCw className="mr-1 h-3 w-3" /> Refresh
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xs">
            <span className="font-semibold text-slate-600 px-1">Print Options:</span>
            <select
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
              className="h-7 rounded border border-slate-300 bg-slate-50 px-2 text-xs text-slate-800"
            >
              <option value="1">Images: 1 column per row</option>
              <option value="2">Images: 2 column per row</option>
              <option value="3">Images: 3 column per row</option>
            </select>
            <div className="flex items-center gap-1">
              <span>Width:</span>
              <input
                type="text"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="h-7 w-12 rounded border border-slate-300 px-1 text-center text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Height:</span>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="h-7 w-12 rounded border border-slate-300 px-1 text-center text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Rows X Cols</span>
              <select
                value={rowsCols}
                onChange={(e) => setRowsCols(e.target.value)}
                className="h-7 rounded border border-slate-300 bg-slate-50 px-2 text-xs"
              >
                <option value="4X2">4X2</option>
                <option value="3X2">3X2</option>
                <option value="2X2">2X2</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <button type="button" onClick={() => { setInitialRuleMode('Rule of two'); setIsTiffaOpen(true); }} className="legacy-small-button">Rule of two</button>
            <button type="button" onClick={() => { setInitialRuleMode('Rule of three'); setIsTiffaOpen(true); }} className="legacy-small-button">Rule of three</button>
            <button type="button" onClick={() => { setInitialRuleMode('Rule of four'); setIsTiffaOpen(true); }} className="legacy-small-button">Rule of four</button>
            <button type="button" onClick={() => setIsOrganEditingOpen(true)} className="legacy-small-button">Organ drawing</button>
            <button type="button" onClick={() => setIsCompareOpen(true)} className="legacy-small-button">Image compare</button>
            <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">Export to PPT</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex shrink-0 border-b border-slate-200 bg-slate-100 px-4 pt-2 gap-1 text-xs font-semibold">
          {[
            { id: 'images', label: 'Images' },
            { id: 'videos', label: 'Videos' },
            { id: 'configurations', label: 'Configurations' },
            { id: 'spooler', label: 'Spooler' },
            { id: 'patient-archival', label: 'Patient data archival' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-md px-4 py-2 border-t border-x transition ${
                activeTab === tab.id
                  ? 'border-slate-300 bg-white text-teal-700 font-bold border-b-white -mb-px shadow-2xs'
                  : 'border-transparent text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 p-3">
          {/* 1. IMAGES TAB */}
          {activeTab === 'images' && (
            <div className="grid h-full min-h-0 grid-cols-[1fr_320px] gap-3">
              <div className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-2xs overflow-auto">
                {importedImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {importedImages.map((img, idx) => (
                      <div key={idx} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 aspect-4/3">
                        <img src={img} alt={`Imported ${idx}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          disabled={busy} title="Archive image (original preserved)" onClick={() => archive([img])}
                          className="absolute right-1 top-1 rounded bg-slate-900/70 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                    <Tv className="mb-2 h-12 w-12 stroke-1 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No images imported for this visit</p>
                    <p className="mt-1 text-xs text-slate-400">Import PNG, JPEG or WebP files. DICOM decoding is not configured.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" disabled={busy || !importedImages.length} onClick={exportImages} className="legacy-small-button">Export originals</button>
                  <label className="legacy-small-button cursor-pointer justify-center">
                    Import
                    <input type="file" disabled={busy} accept="image/png,image/jpeg,image/webp" multiple onChange={handleImageImport} className="hidden" />
                  </label>
                  <button type="button" disabled={busy || !importedImages.length} onClick={() => archive(importedImages)} className="legacy-small-button">Archive images</button>
                  <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">Process</button>
                  <button type="button" disabled={busy || !importedImages.length} onClick={() => setPrintImages(importedImages)} className="legacy-small-button">Print preview</button>
                  <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">Send</button>
                </div>
                <button type="button" disabled={busy || !records.some(item => item.status === 'Archived' && item.type?.startsWith('image/'))} onClick={restoreImages} className="legacy-small-button">Restore archived images</button>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <div className="mb-2 text-xs font-semibold text-slate-700">Anonymous images</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button text-[11px]">Image Title</button>
                    <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button text-[11px]">Ink Save</button>
                    <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button text-[11px]">Rule of three...</button>
                  </div>
                </div>

                <div className="flex-1 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <label className="field-label text-xs font-semibold text-slate-700">
                    Template name
                    <select className="h-8 rounded border border-slate-300 bg-white px-2 text-xs">
                      <option>Select template</option>
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">Save</button>
                    <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">Delete</button>
                    <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">Clear</button>
                    <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">Print</button>
                    <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button col-span-2">Clear image</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. VIDEOS TAB */}
          {activeTab === 'videos' && (
            <div className="grid h-full min-h-0 grid-cols-[1fr_300px] gap-3">
              <div className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-2xs overflow-auto">
                <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
                  <Tv className="mb-2 h-12 w-12 stroke-1" />
                  {importedVideos.filter(item=>item.name.toLowerCase().includes(searchTitle.toLowerCase())).map(item=><div key={item.id} className="w-full p-2"><video src={item.url} controls className="max-h-80 w-full" /><p>{item.name}</p><a href={item.url} download={item.name} className="underline">Download original</a></div>)}
                  {!importedVideos.length && <p className="text-sm font-medium text-slate-600">No videos saved for this visit</p>}
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex gap-2">
                  <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button flex-1">Export</button>
                  <label className="legacy-small-button flex-1">Import<input type="file" disabled={busy} accept="video/mp4,video/webm" multiple className="hidden" onChange={handleImageImport} /></label>
                  <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button flex-1">Delete</button>
                </div>

                <label className="field-label">
                  Original format (conversion unavailable)
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                  >
                    <option value="avi">avi</option>
                    <option value="mp4">mp4</option>
                    <option value="wmv">wmv</option>
                  </select>
                </label>

                <label className="field-label">
                  Search title (Press enter)
                  <input
                    type="text"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    className="legacy-input"
                  />
                </label>

                <label className="field-label flex-1">
                  Video Title
                  <textarea
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="h-36 w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setVideoTitle('')}
                  className="legacy-small-button self-end"
                >
                  Clear Video Title
                </button>
              </div>
            </div>
          )}

          {/* 3. CONFIGURATIONS TAB */}
          {activeTab === 'configurations' && (
            <div className="grid h-full min-h-0 grid-cols-[220px_1fr_220px] gap-3">
              <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="text-xs font-semibold text-slate-700">Image Title</div>
                <div className="h-48 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-2 text-xs">
                  <p className="text-slate-400">No custom titles</p>
                </div>
                <label className="field-label">
                  Title Name
                  <input
                    type="text"
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    className="legacy-input"
                  />
                </label>
                <label className="field-label">
                  Title Type
                  <select
                    value={titleType}
                    onChange={(e) => setTitleType(e.target.value)}
                    className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                  >
                    <option>Standard</option>
                    <option>Custom</option>
                  </select>
                </label>
                <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button self-end">Add</button>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs overflow-y-auto">
                <fieldset className="rounded-lg border border-slate-200 p-3">
                  <legend className="px-1 text-xs font-semibold text-slate-700">Dicom SCU Config</legend>
                  <table className="data-table mb-3">
                    <thead>
                      <tr>
                        <th>AETitle</th>
                        <th>IPAddress</th>
                        <th>Port</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dicomConfigs.map((cfg, idx) => (
                        <tr key={idx}>
                          <td>{cfg.aeTitle}</td>
                          <td>{cfg.ipAddress}</td>
                          <td>{cfg.port}</td>
                          <td>{cfg.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                      placeholder="AETitle"
                      value={aeTitle}
                      onChange={(e) => setAeTitle(e.target.value)}
                      className="legacy-input"
                    />
                    <input
                      placeholder="IP Address"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className="legacy-input"
                    />
                    <input
                      placeholder="Port"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="legacy-input"
                    />
                    <input
                      placeholder="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="legacy-input"
                    />
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button type="button" onClick={addDicomConfig} className="legacy-small-button">Add</button>
                  </div>
                </fieldset>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">Network Ping</button>
                  <button type="button" disabled title="Not implemented — integration pending" className="legacy-small-button">Dicom Ping</button>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <fieldset className="rounded-lg border border-slate-200 p-3">
                  <legend className="px-1 text-xs font-semibold text-slate-700">Image/Video View Settings</legend>
                  <label className="field-label mt-1">
                    Image/Video Aspect Ratio
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                    >
                      <option value="4:3">4:3</option>
                      <option value="16:9">16:9</option>
                      <option value="1:1">1:1</option>
                      <option value="Original">Original</option>
                    </select>
                  </label>
                </fieldset>
              </div>
            </div>
          )}

          {/* 4. SPOOLER TAB */}
          {activeTab === 'spooler' && (
            <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="data-table min-w-[640px]">
                  <thead>
                    <tr>
                      <th>PatientId</th>
                      <th>ImageId</th>
                      <th>AETitle</th>
                      <th>IpAddress</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spoolerItems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400">
                          Spooler queue is empty
                        </td>
                      </tr>
                    ) : (
                      spoolerItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.patientId}</td>
                          <td>{item.imageId}</td>
                          <td>{item.aeTitle}</td>
                          <td>{item.ipAddress}</td>
                          <td>{item.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 pt-2">
                <button type="button" onClick={() => setSpoolerItems([])} className="legacy-small-button">Clear Success</button>
                <button type="button" onClick={() => setSpoolerItems([])} className="legacy-small-button">Clear All</button>
              </div>
            </div>
          )}

          {/* 5. PATIENT DATA ARCHIVAL TAB */}
          {activeTab === 'patient-archival' && (
            <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
              <p className="mb-2 text-xs font-semibold text-slate-700">Double click to open the PDF</p>
              <div className="min-h-0 flex-1 overflow-auto rounded border border-slate-200 bg-slate-50 p-3">
                {archivedPdfs.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {archivedPdfs.map((pdf, idx) => (
                      <a
                        key={idx}
                        href={pdf.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs hover:bg-teal-50 hover:border-teal-300 transition"
                      >
                        <FileText className="h-8 w-8 text-red-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-800">{pdf.name}</p>
                          <p className="text-[10px] text-slate-400">{pdf.date} · {pdf.size}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                    No PDF archives imported for this patient yet
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-start border-t border-slate-200 pt-2">
                <label className="legacy-small-button cursor-pointer">
                  Import PDF
                  <input type="file" disabled={busy} accept=".pdf" multiple onChange={handlePdfImport} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Status Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-300 bg-slate-100 px-4 py-1.5 text-[11px] font-medium text-slate-600">
          <span>Ready</span>
          <span>(Ctrl + A) - Select All &nbsp;|&nbsp; (Ctrl + D) - Deselect All</span>
        </div>
      </div>

      <ImageCompareModal
        open={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        images={importedImages}
        mediaRecords={records}
        patient={patient}
        visitId={visitId}
        visitDate={visitDate}
      />
      <OrganEditingModal
        open={isOrganEditingOpen}
        onClose={() => setIsOrganEditingOpen(false)}
      />
      <TiffaTemplateModal
        open={isTiffaOpen}
        onClose={() => setIsTiffaOpen(false)}
        patient={patient}
        images={importedImages}
        initialRuleMode={initialRuleMode}
        mediaRecords={records}
        visitId={visitId}
        visitDate={visitDate}
      />
      {printImages && <MediaPrintPreview images={printImages} columns={columns} title="Patient images" patientId={patient?.patient_id} patientName={patientName} visitId={visitId} visitDate={visitDate} onClose={() => setPrintImages(null)} />}
    </div>
  )
}
