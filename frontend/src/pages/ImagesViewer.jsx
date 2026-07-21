import { useMemo, useRef, useState } from 'react'
import {
  ArrowRightLeft, CheckCircle2, Database, Download, Film, Image as ImageIcon,
  Monitor, Play, Plus, Save, Settings2, Trash2, Upload, UserRound, XCircle,
} from 'lucide-react'

const tabs = [
  ['images', 'Images', ImageIcon], ['videos', 'Videos', Film],
  ['compare', 'Image Compare', ArrowRightLeft], ['patient-data', 'Patient Data', UserRound],
  ['spooler', 'Spooler', Database], ['configuration', 'Configuration', Monitor],
]

const defaultConfig = {
  aeTitle: 'ECHOSCAN', host: '127.0.0.1', port: '104', callingAe: 'ECHOSCAN',
  rows: '2', columns: '2', width: '600', height: '450', autoRefresh: true,
  includePatientData: true,
}

const initialPatient = {
  patientId: '', patientName: '', dateOfBirth: '', sex: '', accessionNumber: '',
  studyDate: '', modality: 'US', referringDoctor: '', studyDescription: '',
}

function readConfig() {
  try { return { ...defaultConfig, ...JSON.parse(localStorage.getItem('echo-image-configuration') || '{}') } }
  catch { return defaultConfig }
}

function ImagesViewer() {
  const [activeTab, setActiveTab] = useState('images')
  const [assets, setAssets] = useState([])
  const [patient, setPatient] = useState(initialPatient)
  const [config, setConfig] = useState(readConfig)
  const [queue, setQueue] = useState([])
  const [status, setStatus] = useState('')
  const imageInput = useRef(null)
  const videoInput = useRef(null)
  const images = useMemo(() => assets.filter((asset) => asset.kind === 'image'), [assets])
  const videos = useMemo(() => assets.filter((asset) => asset.kind === 'video'), [assets])

  const importFiles = (fileList, kind) => {
    const next = Array.from(fileList || [])
      .filter((file) => file.type.startsWith(`${kind}/`))
      .map((file, index) => ({
        id: `${Date.now()}-${index}`, name: file.name, title: file.name.replace(/\.[^.]+$/, ''),
        size: file.size, kind, url: URL.createObjectURL(file), selected: false,
      }))
    setAssets((current) => [...current, ...next])
    setStatus(`${next.length} ${kind}${next.length === 1 ? '' : 's'} imported.`)
  }

  const removeAsset = (id) => {
    const removed = assets.find((asset) => asset.id === id)
    if (removed) URL.revokeObjectURL(removed.url)
    setAssets((current) => current.filter((asset) => asset.id !== id))
  }

  const addToQueue = () => {
    const selected = assets.filter((asset) => asset.selected)
    const source = selected.length ? selected : assets
    if (!source.length) return setStatus('Import an image or video before adding a spooler job.')
    setQueue((current) => [{
      id: Date.now(), patient: patient.patientName || patient.patientId || 'Unassigned patient',
      destination: `${config.aeTitle} · ${config.host}:${config.port}`,
      files: source.length, state: 'Pending',
    }, ...current])
    setStatus('Spooler job added.')
  }

  const saveConfig = () => {
    localStorage.setItem('echo-image-configuration', JSON.stringify(config))
    setStatus('Image configuration saved.')
  }

  const active = tabs.find(([id]) => id === activeTab)
  const ActiveIcon = active?.[2] || ImageIcon

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><ActiveIcon className="h-5 w-5" /></div>
          <div><h1 className="text-xl font-semibold text-slate-950">Images &amp; DICOM</h1><p className="text-sm text-slate-500">Review, compare and transfer study media</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="secondary-button" onClick={() => imageInput.current?.click()}><Upload className="h-4 w-4" /> Import images</button>
          <button type="button" className="secondary-button" onClick={() => videoInput.current?.click()}><Film className="h-4 w-4" /> Import videos</button>
          <button type="button" className="primary-button" onClick={addToQueue}><Plus className="h-4 w-4" /> Add to spooler</button>
          <input ref={imageInput} className="hidden" type="file" accept="image/*" multiple onChange={(event) => importFiles(event.target.files, 'image')} />
          <input ref={videoInput} className="hidden" type="file" accept="video/*" multiple onChange={(event) => importFiles(event.target.files, 'video')} />
        </div>
      </div>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 pt-2">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => { setActiveTab(id); setStatus('') }} className={`flex shrink-0 items-center gap-2 rounded-t-lg border px-4 py-2.5 text-sm font-semibold transition ${activeTab === id ? 'border-slate-200 border-b-white bg-white text-teal-700' : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {status && <div className="mx-5 mt-4 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-800"><span>{status}</span><button type="button" onClick={() => setStatus('')} aria-label="Dismiss message"><XCircle className="h-4 w-4" /></button></div>}

      <div className="min-h-0 flex-1 overflow-auto p-5">
        {activeTab === 'images' && <MediaLibrary kind="image" items={images} onImport={() => imageInput.current?.click()} onRemove={removeAsset} setAssets={setAssets} />}
        {activeTab === 'videos' && <MediaLibrary kind="video" items={videos} onImport={() => videoInput.current?.click()} onRemove={removeAsset} setAssets={setAssets} />}
        {activeTab === 'compare' && <ImageCompare images={images} />}
        {activeTab === 'patient-data' && <PatientData patient={patient} setPatient={setPatient} onSave={() => setStatus('Patient study data saved for this session.')} />}
        {activeTab === 'spooler' && <Spooler queue={queue} setQueue={setQueue} onProcess={() => { setQueue((current) => current.map((job) => ({ ...job, state: 'Completed' }))); setStatus(queue.length ? 'All pending jobs completed.' : 'The spooler queue is empty.') }} />}
        {activeTab === 'configuration' && <Configuration config={config} setConfig={setConfig} onSave={saveConfig} />}
      </div>
    </div>
  )
}

function MediaLibrary({ kind, items, onImport, onRemove, setAssets }) {
  const toggle = (id) => setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, selected: !asset.selected } : asset))
  if (!items.length) return <EmptyPanel icon={kind === 'image' ? ImageIcon : Film} title={`No ${kind === 'image' ? 'images' : 'videos'} imported`} text={`Import study ${kind === 'image' ? 'images' : 'videos'} to review and attach them to the current patient.`} action={<button type="button" className="primary-button mt-5" onClick={onImport}><Upload className="h-4 w-4" /> Import {kind === 'image' ? 'images' : 'videos'}</button>} />
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm ${item.selected ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'}`}>
          <div className="aspect-video overflow-hidden bg-slate-900">{kind === 'image' ? <img src={item.url} alt={item.title} onClick={() => toggle(item.id)} className="h-full w-full cursor-pointer object-contain" /> : <video src={item.url} className="h-full w-full object-contain" controls />}</div>
          <div className="flex items-start justify-between gap-3 p-3"><button type="button" onClick={() => toggle(item.id)} className="min-w-0 text-left"><p className="truncate text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{formatBytes(item.size)}{item.selected ? ' · Selected' : ''}</p></button><div className="flex gap-1"><a href={item.url} download={item.name} className="toolbar-button h-9 px-2" aria-label={`Download ${item.name}`}><Download className="h-4 w-4" /></a><button type="button" onClick={() => onRemove(item.id)} className="toolbar-button h-9 px-2 text-red-600" aria-label={`Delete ${item.name}`}><Trash2 className="h-4 w-4" /></button></div></div>
        </article>
      ))}
    </div>
  )
}

function ImageCompare({ images }) {
  const [leftId, setLeftId] = useState('')
  const [rightId, setRightId] = useState('')
  if (images.length < 2) return <EmptyPanel icon={ArrowRightLeft} title="Two images are required" text="Import at least two images before opening image comparison." />
  const left = images.find((image) => image.id === leftId) || images[0]
  const right = images.find((image) => image.id === rightId) || images[1]
  return <div className="space-y-4"><div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-2"><SelectField label="Left image" value={left.id} onChange={setLeftId} options={images.map((item) => [item.id, item.name])} /><SelectField label="Right image" value={right.id} onChange={setRightId} options={images.map((item) => [item.id, item.name])} /></div><div className="grid gap-4 xl:grid-cols-2">{[left, right].map((item, index) => <div key={`${item.id}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950"><img src={item.url} alt={item.title} className="aspect-video h-full w-full object-contain" /><div className="bg-white px-4 py-3 text-sm font-medium text-slate-800">{item.name}</div></div>)}</div></div>
}

function PatientData({ patient, setPatient, onSave }) {
  const update = (key, value) => setPatient((current) => ({ ...current, [key]: value }))
  return <Panel icon={UserRound} title="Patient and study data" description="Information attached to imported media and DICOM transfers"><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[['patientId', 'Patient ID'], ['patientName', 'Patient name'], ['dateOfBirth', 'Date of birth', 'date'], ['accessionNumber', 'Accession number'], ['studyDate', 'Study date', 'date'], ['referringDoctor', 'Referring doctor'], ['studyDescription', 'Study description']].map(([key, label, type]) => <TextField key={key} label={label} type={type} value={patient[key]} onChange={(value) => update(key, value)} />)}<SelectField label="Sex" value={patient.sex} onChange={(value) => update('sex', value)} options={[['', 'Select'], ['M', 'Male'], ['F', 'Female'], ['O', 'Other']]} /><SelectField label="Modality" value={patient.modality} onChange={(value) => update('modality', value)} options={[['US', 'Ultrasound'], ['OT', 'Other']]} /></div><div className="mt-6 flex justify-end"><button type="button" className="primary-button" onClick={onSave}><Save className="h-4 w-4" /> Save patient data</button></div></Panel>
}

function Spooler({ queue, setQueue, onProcess }) {
  return <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><SectionTitle icon={Database} title="DICOM spooler" description="Monitor queued study transfers" /><button type="button" className="primary-button" onClick={onProcess}><Play className="h-4 w-4" /> Process pending</button></div><div className="overflow-hidden rounded-xl border border-slate-200"><table className="data-table"><thead><tr><th>Patient</th><th>Destination</th><th>Files</th><th>Status</th><th>Action</th></tr></thead><tbody>{queue.map((job) => <tr key={job.id}><td>{job.patient}</td><td>{job.destination}</td><td>{job.files}</td><td><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${job.state === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><CheckCircle2 className="h-3.5 w-3.5" />{job.state}</span></td><td><button type="button" onClick={() => setQueue((current) => current.filter((item) => item.id !== job.id))} className="toolbar-button h-8 px-2 text-red-600"><Trash2 className="h-4 w-4" /></button></td></tr>)}{!queue.length && <tr><td colSpan="5" className="py-16 text-center text-slate-500">No transfer jobs in the queue.</td></tr>}</tbody></table></div></div>
}

function Configuration({ config, setConfig, onSave }) {
  const update = (key, value) => setConfig((current) => ({ ...current, [key]: value }))
  return <div className="mx-auto max-w-5xl space-y-5"><Panel icon={Settings2} title="DICOM destination" description="Connection used by image transfers and the spooler"><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[['aeTitle', 'AE title'], ['host', 'Host or IP address'], ['port', 'Port', 'number'], ['callingAe', 'Calling AE']].map(([key, label, type]) => <TextField key={key} label={label} type={type} value={config[key]} onChange={(value) => update(key, value)} />)}</div></Panel><Panel icon={Monitor} title="Viewer layout" description="Default arrangement for study media"><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{['rows', 'columns', 'width', 'height'].map((key) => <TextField key={key} label={key[0].toUpperCase() + key.slice(1)} type="number" value={config[key]} onChange={(value) => update(key, value)} />)}</div><div className="mt-5 flex flex-wrap gap-6"><CheckField label="Auto refresh studies" checked={config.autoRefresh} onChange={(value) => update('autoRefresh', value)} /><CheckField label="Include patient data when exporting" checked={config.includePatientData} onChange={(value) => update('includePatientData', value)} /></div></Panel><div className="flex justify-end"><button type="button" className="primary-button" onClick={onSave}><Save className="h-4 w-4" /> Save configuration</button></div></div>
}

function Panel({ icon, title, description, children }) { return <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><SectionTitle icon={icon} title={title} description={description} />{children}</div> }
function EmptyPanel({ icon: Icon, title, text, action }) { return <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center"><Icon className="mb-4 h-10 w-10 text-teal-700" /><h2 className="text-lg font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{text}</p>{action}</div> }
function SectionTitle({ icon: Icon, title, description }) { return <div className="flex items-start gap-3"><div className="rounded-lg bg-teal-50 p-2 text-teal-700"><Icon className="h-5 w-5" /></div><div><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-0.5 text-sm text-slate-500">{description}</p></div></div> }
function TextField({ label, value, onChange, type = 'text' }) { return <label className="field-label">{label}<input className="field-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function SelectField({ label, value, onChange, options }) { return <label className="field-label">{label}<select className="field-control" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label> }
function CheckField({ label, checked, onChange }) { return <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />{label}</label> }
function formatBytes(bytes) { if (!bytes) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}` }

export default ImagesViewer
