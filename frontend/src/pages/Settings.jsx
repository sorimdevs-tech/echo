import { useState } from 'react'
import { Building2, FileDigit, FileText, Plus, RotateCcw, Ruler, Save, Settings as SettingsIcon, SlidersHorizontal, Trash2, UserCog, Users } from 'lucide-react'

const tabs = [
  ['organisation', 'Organisation', Building2], ['preferences', 'Preferences', SlidersHorizontal],
  ['patient-ids', 'Patient IDs', FileDigit], ['report-formatting', 'Report formatting', FileText],
  ['rule-three', 'Rule of Three', Ruler], ['sonographers', 'Users & Sonographers', Users],
]

const defaults = {
  organisation: { companyName: '', registrationNumber: '', gstPan: '', shortName: '', street: '', area: '', zipCode: '', country: 'Australia', state: 'Victoria', city: '', phone: '', mobile: '', fax: '', email: '', comments: '', inactive: false },
  preferences: { userReportSettings: true, autoDatabaseBackup: true, autoStartDicom: false, lockCompletedReports: true, printQrCode: false, requireConsultant: false, requireInvestigationStatus: true, preventEmptyMandatoryFields: true, confirmSave: false, confirmDelete: true, showRelatedReports: true, allowMultipleSessions: false, preventSamePatientScan: true, retentionDays: '30', centerId: '' },
  patientIds: { mode: 'manual', prefix: 'PT', nextNumber: '1', digits: '6', separator: '', suffixYear: false },
  report: { fontFamily: 'Arial', fontSize: '12', headerFontSize: '15', pageSize: 'A4', orientation: 'Portrait', margins: '20', printImages: true, printPatientData: true, printBiometry: true, printImpression: true, showLogo: true },
}

const initialSections = ['Patient Demography', 'Scan data', 'Indication', 'Measurements', 'Impression', 'Diagnosis', 'ICD-10', 'Doctor signatures'].map((name) => ({ name, enabled: name !== 'ICD-10', bold: name === 'Impression', underline: false }))

function loadJson(key, fallback) {
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') } }
  catch { return fallback }
}
function loadList(key, fallback = []) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null')
    return Array.isArray(saved) ? saved : fallback
  } catch { return fallback }
}

function Settings() {
  const [activeTab, setActiveTab] = useState('organisation')
  const [settings, setSettings] = useState(() => loadJson('echo-application-settings', defaults))
  const [sections, setSections] = useState(() => loadList('echo-report-sections', initialSections))
  const [rules, setRules] = useState(() => loadList('echo-rule-three'))
  const [users, setUsers] = useState(() => loadList('echo-sonographers'))
  const [status, setStatus] = useState('')
  const active = tabs.find(([id]) => id === activeTab)
  const ActiveIcon = active?.[2] || SettingsIcon
  const update = (group, key, value) => setSettings((current) => ({ ...current, [group]: { ...defaults[group], ...current[group], [key]: value } }))
  const save = () => {
    localStorage.setItem('echo-application-settings', JSON.stringify(settings))
    localStorage.setItem('echo-report-sections', JSON.stringify(sections))
    localStorage.setItem('echo-rule-three', JSON.stringify(rules))
    localStorage.setItem('echo-sonographers', JSON.stringify(users))
    setStatus('Settings saved on this device.')
  }

  return (
    <div className="settings-shell flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><ActiveIcon className="h-5 w-5" /></div><div><h1 className="text-xl font-semibold text-slate-950">Settings</h1><p className="text-sm text-slate-500">Configure organisation, reports and application behaviour</p></div></div>
        <div className="flex gap-2"><button type="button" className="secondary-button" onClick={() => { setSettings(defaults); setStatus('Unsaved changes reset.') }}><RotateCcw className="h-4 w-4" /> Reset</button><button type="button" className="primary-button" onClick={save}><Save className="h-4 w-4" /> Save settings</button></div>
      </div>
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 pt-2">
        {tabs.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => { setActiveTab(id); setStatus('') }} className={`flex shrink-0 items-center gap-2 rounded-t-lg border px-4 py-2.5 text-sm font-semibold transition ${activeTab === id ? 'border-slate-200 border-b-white bg-white text-teal-700' : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-900'}`}><Icon className="h-4 w-4" />{label}</button>)}
      </div>
      {status && <div className="mx-5 mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-800">{status}</div>}
      <div className="min-h-0 flex-1 overflow-auto p-5">
        {activeTab === 'organisation' && <Organisation data={{ ...defaults.organisation, ...settings.organisation }} update={(key, value) => update('organisation', key, value)} />}
        {activeTab === 'preferences' && <Preferences data={{ ...defaults.preferences, ...settings.preferences }} update={(key, value) => update('preferences', key, value)} />}
        {activeTab === 'patient-ids' && <PatientIds data={{ ...defaults.patientIds, ...settings.patientIds }} update={(key, value) => update('patientIds', key, value)} />}
        {activeTab === 'report-formatting' && <ReportFormatting data={{ ...defaults.report, ...settings.report }} update={(key, value) => update('report', key, value)} sections={sections} setSections={setSections} />}
        {activeTab === 'rule-three' && <RuleThree rules={rules} setRules={setRules} />}
        {activeTab === 'sonographers' && <Sonographers users={users} setUsers={setUsers} />}
      </div>
    </div>
  )
}

function Organisation({ data, update }) {
  const fields = [['companyName', 'Company name'], ['registrationNumber', 'Registration number'], ['gstPan', 'GST / tax number'], ['shortName', 'Short name'], ['street', 'Street'], ['area', 'Area / P.O.'], ['zipCode', 'Postcode'], ['country', 'Country'], ['state', 'State'], ['city', 'City'], ['phone', 'Phone'], ['mobile', 'Mobile'], ['fax', 'Fax'], ['email', 'Email', 'email']]
  return <Panel icon={Building2} title="Organisation details" description="Information displayed on reports and correspondence"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{fields.map(([key, label, type]) => <TextField key={key} label={label} type={type} value={data[key]} onChange={(value) => update(key, value)} />)}<label className="field-label md:col-span-2 xl:col-span-3">Comments<textarea className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={data.comments} onChange={(event) => update('comments', event.target.value)} /></label></div><div className="mt-5"><CheckField label="Mark organisation as inactive" checked={data.inactive} onChange={(value) => update('inactive', value)} /></div></Panel>
}

function Preferences({ data, update }) {
  const groups = [
    ['General', [['userReportSettings', 'Allow user-specific report settings'], ['autoDatabaseBackup', 'Automatic database backup'], ['autoStartDicom', 'Start DICOM service automatically'], ['allowMultipleSessions', 'Allow multiple sessions for one user']]],
    ['Report validation', [['lockCompletedReports', 'Lock completed reports'], ['printQrCode', 'Print QR code on reports'], ['requireConsultant', 'Require primary consultant'], ['requireInvestigationStatus', 'Require investigation status'], ['preventEmptyMandatoryFields', 'Prevent saving incomplete mandatory fields']]],
    ['Confirmations', [['confirmSave', 'Ask for confirmation when saving'], ['confirmDelete', 'Ask for confirmation before deletion'], ['showRelatedReports', 'Show related patient reports'], ['preventSamePatientScan', 'Prevent duplicate scan for the same patient']]],
  ]
  return <div className="mx-auto max-w-5xl space-y-5">{groups.map(([title, items]) => <Panel key={title} icon={SlidersHorizontal} title={title}><div className="grid gap-4 md:grid-cols-2">{items.map(([key, label]) => <CheckField key={key} label={label} checked={data[key]} onChange={(value) => update(key, value)} />)}</div></Panel>)}<Panel icon={SettingsIcon} title="Centre and retention"><div className="grid gap-4 md:grid-cols-2"><TextField label="Centre ID / name" value={data.centerId} onChange={(value) => update('centerId', value)} /><TextField label="Delete unmodified draft scans after (days)" type="number" value={data.retentionDays} onChange={(value) => update('retentionDays', value)} /></div></Panel></div>
}

function PatientIds({ data, update }) {
  const modes = [['manual', 'Manual ID', 'Staff enter the patient ID'], ['increment', 'Sequential number', 'Increase the last number by one'], ['padded', 'Padded number', 'Add leading zeroes'], ['custom', 'Custom format', 'Combine a prefix, number and year']]
  const preview = data.mode === 'manual' ? 'Entered by user' : `${data.prefix}${data.separator}${String(data.nextNumber).padStart(Number(data.digits) || 1, '0')}${data.suffixYear ? new Date().getFullYear() : ''}`
  return <Panel icon={FileDigit} title="Patient ID generation" description="Choose how new patient identifiers are created"><div className="grid gap-3 md:grid-cols-2">{modes.map(([value, label, detail]) => <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${data.mode === value ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white'}`}><input type="radio" name="patient-id-mode" checked={data.mode === value} onChange={() => update('mode', value)} className="mt-1 h-4 w-4" /><span><span className="block text-sm font-semibold text-slate-900">{label}</span><span className="mt-1 block text-xs text-slate-500">{detail}</span></span></label>)}</div>{data.mode !== 'manual' && <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="Prefix" value={data.prefix} onChange={(value) => update('prefix', value)} /><TextField label="Next number" type="number" value={data.nextNumber} onChange={(value) => update('nextNumber', value)} /><TextField label="Number of digits" type="number" value={data.digits} onChange={(value) => update('digits', value)} /><TextField label="Separator" value={data.separator} onChange={(value) => update('separator', value)} /><CheckField label="Append current year" checked={data.suffixYear} onChange={(value) => update('suffixYear', value)} /></div>}<div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preview</p><p className="mt-2 text-xl font-semibold text-teal-700">{preview}</p></div></Panel>
}

function ReportFormatting({ data, update, sections, setSections }) {
  return <div className="mx-auto max-w-6xl space-y-5"><Panel icon={FileText} title="Page and type settings"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SelectField label="Font family" value={data.fontFamily} onChange={(value) => update('fontFamily', value)} options={['Arial', 'Inter', 'Times New Roman', 'Calibri']} /><TextField label="Body font size" type="number" value={data.fontSize} onChange={(value) => update('fontSize', value)} /><TextField label="Header font size" type="number" value={data.headerFontSize} onChange={(value) => update('headerFontSize', value)} /><SelectField label="Page size" value={data.pageSize} onChange={(value) => update('pageSize', value)} options={['A4', 'Letter', 'Legal']} /><SelectField label="Orientation" value={data.orientation} onChange={(value) => update('orientation', value)} options={['Portrait', 'Landscape']} /><TextField label="Margins (mm)" type="number" value={data.margins} onChange={(value) => update('margins', value)} /></div><div className="mt-5 flex flex-wrap gap-6">{[['printImages', 'Print images'], ['printPatientData', 'Print patient data'], ['printBiometry', 'Print biometry'], ['printImpression', 'Print impression'], ['showLogo', 'Show organisation logo']].map(([key, label]) => <CheckField key={key} label={label} checked={data[key]} onChange={(value) => update(key, value)} />)}</div></Panel><Panel icon={FileText} title="Report sections"><div className="overflow-hidden rounded-lg border border-slate-200"><table className="data-table"><thead><tr><th>Section</th><th>Print</th><th>Bold</th><th>Underline</th></tr></thead><tbody>{sections.map((section, index) => <tr key={section.name}><td className="font-medium">{section.name}</td>{['enabled', 'bold', 'underline'].map((key) => <td key={key}><input type="checkbox" checked={section[key]} onChange={(event) => setSections((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: event.target.checked } : item))} /></td>)}</tr>)}</tbody></table></div></Panel></div>
}

function RuleThree({ rules, setRules }) {
  const [draft, setDraft] = useState({ type: 'Fetal Echo', title: '', template: '' })
  const add = () => { if (!draft.title.trim()) return; setRules((current) => [...current, { ...draft, id: Date.now() }]); setDraft({ ...draft, title: '', template: '' }) }
  return <div className="grid gap-5 xl:grid-cols-[360px_1fr]"><Panel icon={Plus} title="Add title or template"><div className="space-y-4"><SelectField label="Report type" value={draft.type} onChange={(value) => setDraft((current) => ({ ...current, type: value }))} options={['Adult Echo', 'Fetal Echo', 'Pediatric Echo']} /><TextField label="Title" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} /><label className="field-label">Template<textarea className="min-h-28 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={draft.template} onChange={(event) => setDraft((current) => ({ ...current, template: event.target.value }))} /></label><button type="button" className="primary-button w-full justify-center" onClick={add}><Plus className="h-4 w-4" /> Add rule</button></div></Panel><Panel icon={Ruler} title="Rule of Three master"><MasterTable empty="No Rule of Three entries added." headers={['Report type', 'Title', 'Template', 'Action']} rows={rules.map((rule) => [rule.type, rule.title, rule.template || '—', <DeleteButton key={rule.id} onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))} />])} /></Panel></div>
}

function Sonographers({ users, setUsers }) {
  const empty = { firstName: '', lastName: '', initials: '', username: '', designation: '', registration: '', mobile: '', role: 'Sonographer', inactive: false }
  const [draft, setDraft] = useState(empty)
  const add = () => { if (!draft.firstName.trim()) return; setUsers((current) => [...current, { ...draft, id: Date.now() }]); setDraft(empty) }
  const fields = [['firstName', 'First name'], ['lastName', 'Last name'], ['initials', 'Initials'], ['username', 'Username'], ['designation', 'Designation'], ['registration', 'Registration number'], ['mobile', 'Mobile']]
  return <div className="space-y-5"><Panel icon={UserCog} title="Add sonographer or reporting user"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{fields.map(([key, label]) => <TextField key={key} label={label} value={draft[key]} onChange={(value) => setDraft((current) => ({ ...current, [key]: value }))} />)}<SelectField label="Role" value={draft.role} onChange={(value) => setDraft((current) => ({ ...current, role: value }))} options={['Sonographer', 'Reporting Doctor', 'Administrator', 'Read only']} /></div><div className="mt-5 flex items-center justify-between"><CheckField label="Inactive" checked={draft.inactive} onChange={(value) => setDraft((current) => ({ ...current, inactive: value }))} /><button type="button" className="primary-button" onClick={add}><Plus className="h-4 w-4" /> Add user</button></div></Panel><Panel icon={Users} title="Sonographers and users"><MasterTable empty="No sonographers added." headers={['Name', 'Initials', 'Username', 'Role', 'Status', 'Action']} rows={users.map((user) => [`${user.firstName} ${user.lastName}`, user.initials || '—', user.username || '—', user.role, user.inactive ? 'Inactive' : 'Active', <DeleteButton key={user.id} onClick={() => setUsers((current) => current.filter((item) => item.id !== user.id))} />])} /></Panel></div>
}

function MasterTable({ headers, rows, empty }) { return <div className="overflow-hidden rounded-lg border border-slate-200"><table className="data-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}{!rows.length && <tr><td colSpan={headers.length} className="py-12 text-center text-slate-500">{empty}</td></tr>}</tbody></table></div> }
function DeleteButton({ onClick }) { return <button type="button" className="toolbar-button h-8 px-2 text-red-600" onClick={onClick}><Trash2 className="h-4 w-4" /></button> }
function Panel({ icon: Icon, title, description, children }) { return <section className="mx-auto w-full max-w-6xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-start gap-3"><div className="rounded-lg bg-teal-50 p-2 text-teal-700"><Icon className="h-5 w-5" /></div><div><h2 className="font-semibold text-slate-950">{title}</h2>{description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}</div></div>{children}</section> }
function TextField({ label, value, onChange, type = 'text' }) { return <label className="field-label">{label}<input className="field-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function SelectField({ label, value, onChange, options }) { return <label className="field-label">{label}<select className="field-control" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label> }
function CheckField({ label, checked, onChange }) { return <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />{label}</label> }

export default Settings
