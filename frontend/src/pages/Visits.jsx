import { useEffect, useState } from 'react'
import { Activity, Calendar, CheckCircle2, FileText, Plus, Save, Search, Stethoscope, Trash2, UserCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate } from 'react-router-dom'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'
import { workspaceService } from '../api/workspaceService'
import ReferralDoctorModal from '../components/ReferralDoctorModal'

export default function Visits() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [visits, setVisits] = useState([])
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [templates, setTemplates] = useState([])
  const [referralOpen, setReferralOpen] = useState(false)
  const [visitData, setVisitData] = useState({ visit_date: '', referral_doctor: '', report_template_id: '', notes: '' })

  useEffect(() => {
    Promise.all([patientService.getPatients(), workspaceService.getTemplates()])
      .then(([patientResult, templateResult]) => { setPatients(patientResult.data || []); setTemplates(templateResult.data || []) })
      .catch(() => { setPatients([]); setTemplates([]) })
  }, [])

  const selectPatient = async (patientId) => {
    setSelectedPatient(patientId)
    setStatus('')
    if (!patientId) { setVisits([]); setScans([]); return }
    setLoading(true)
    try {
      const [visitResult, scanResult] = await Promise.all([
        patientService.getVisits(patientId),
        scanService.getScansByPatient(patientId),
      ])
      setVisits(visitResult.data || [])
      setScans(scanResult.data || [])
    } catch {
      setVisits([]); setScans([])
    } finally { setLoading(false) }
  }

  const addVisit = async (event) => {
    event.preventDefault()
    if (!selectedPatient) { alert('Please select a patient'); return }
    const selectedPatientRecord = patients.find((item) => item.id === selectedPatient)
    if (!selectedPatientRecord) { alert('The selected patient record could not be found'); return }
    setSaving(true)
    setStatus('')
    try {
      const result = await patientService.addVisit(selectedPatient, {
        ...visitData,
        patient_id: selectedPatient,
        patient_display_id: selectedPatientRecord.patient_id,
        patient_name: `${selectedPatientRecord.first_name || ''} ${selectedPatientRecord.last_name || ''}`.trim(),
      })
      setVisits([result.data, ...visits])
      setVisitData({ visit_date: '', referral_doctor: '', report_template_id: '', notes: '' })
      setStatus(`Visit added and linked to ${selectedPatientRecord.patient_id} — ${selectedPatientRecord.first_name} ${selectedPatientRecord.last_name}`)
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to add visit')
    } finally { setSaving(false) }
  }

  const deleteVisit = async (visitId) => {
    if (!selectedPatient || !visitId) return
    await patientService.deleteVisit(selectedPatient, visitId)
    setVisits(visits.filter((visit) => visit.id !== visitId))
    setStatus('Visit removed from this patient')
  }

  const patient = patients.find((item) => item.id === selectedPatient)
  const openEcho = (type) => {
    if (!selectedPatient) return
    const matchingScan = scans.find((scan) => scan.scan_type === type)
    const visitId = matchingScan?.visit_id || visits[0]?.id || ''
    navigate(`/echo-studies?patient=${selectedPatient}&visit=${visitId}&type=${encodeURIComponent(type)}`)
  }

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-end">
          <label className="field-label flex-1">
            <span>Select patient</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select className="field-control pl-9" value={selectedPatient} onChange={(event) => selectPatient(event.target.value)}>
                <option value="">Search or select a patient</option>
                {patients.map((item) => <option key={item.id} value={item.id}>{item.patient_id} — {item.first_name} {item.last_name}</option>)}
              </select>
            </div>
          </label>
          <button type="button" className="secondary-button" onClick={() => navigate('/patients/new')}><Plus className="h-4 w-4" />New patient</button>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[1fr_180px]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PatientField label="Patient ID" value={patient?.patient_id} />
            <PatientField label="First name" value={patient?.first_name} />
            <PatientField label="Last name" value={patient?.last_name} />
            <PatientField label="Aadhaar number" value={patient?.aadhaar_no} />
            <PatientField label="Gender" value={patient?.gender} />
            <PatientField label="Age" value={patient?.age} />
            <PatientField label="Date of birth" value={patient?.dob} />
            <PatientField label="Ethnic origin" value={patient?.ethnic_origin} />
            <PatientField label="Street" value={patient?.street} wide />
            <PatientField label="Taluk" value={patient?.taluk} />
            <PatientField label="Area" value={patient?.area} />
            <PatientField label="Area (P.O.)" value={patient?.area_po} />
            <PatientField label="Zip code" value={patient?.zip_code} />
            <PatientField label="City" value={patient?.district_city} />
            <PatientField label="State" value={patient?.state} />
            <PatientField label="Country" value={patient?.country} />
            <PatientField label="Phone #1" value={patient?.phone1} />
            <PatientField label="Phone #2" value={patient?.phone2} />
            <PatientField label="Mobile" value={patient?.mobile} />
            <PatientField label="Fax" value={patient?.fax} />
            <PatientField label="Email" value={patient?.email} wide />
            <PatientField label="Family doctor" value={patient?.family_doctor} wide />
          </div>
          <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            {patient ? <QRCodeSVG value={JSON.stringify({id:patient.id,patient_id:patient.patient_id,name:`${patient.first_name||''} ${patient.last_name||''}`.trim()})} size={112} level="M" includeMargin /> : <div className="h-28 w-28 rounded-lg border-2 border-dashed border-slate-300" />}
            <span className="mt-2 text-xs font-medium text-slate-500">{patient?.patient_id || 'Patient QR code'}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div><h2 className="font-semibold text-slate-900">Visits</h2><p className="text-xs text-slate-500">Add and review visits for the selected patient.</p></div>
            {loading && <span className="text-xs text-teal-700">Loading…</span>}
          </div>
          {patient ? <div className="flex items-center gap-3 border-b border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900"><UserCheck className="h-5 w-5 text-primary-600" /><span>New visits will be linked to <strong>{patient.patient_id} — {patient.first_name} {patient.last_name}</strong></span></div> : <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select a patient above before adding a visit.</div>}
          {status && <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4" />{status}</div>}
          <form onSubmit={addVisit} className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 lg:grid-cols-[220px_1fr_1fr_auto]">
            <label className="field-label"><span>Visit date and time *</span><input required disabled={!patient || saving} type="datetime-local" className="field-control disabled:bg-slate-100" value={visitData.visit_date} onChange={(event) => setVisitData({...visitData, visit_date:event.target.value})} /></label>
            <label className="field-label"><span>Report template</span><select disabled={!patient || saving} className="field-control disabled:bg-slate-100" value={visitData.report_template_id} onChange={(event) => setVisitData({...visitData, report_template_id:event.target.value})}><option value="">Select</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.title || template.name || template.scan_type}</option>)}</select></label>
            <label className="field-label"><span>Visit notes</span><input disabled={!patient || saving} className="field-control disabled:bg-slate-100" placeholder="Visit notes" value={visitData.notes} onChange={(event) => setVisitData({...visitData, notes:event.target.value})} /></label>
            <button disabled={!patient || saving || !visitData.visit_date} className="primary-button self-end disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Add visit'}</button>
          </form>
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3">
            <button type="button" disabled={!patient} onDoubleClick={() => setReferralOpen(true)} onClick={() => setReferralOpen(true)} className="secondary-button disabled:opacity-40"><Stethoscope className="h-4 w-4" />New referral doctor</button>
            <button type="button" disabled={!patient || !visits.length} onClick={() => navigate(`/echo-studies?patient=${selectedPatient}&visit=${visits[0]?.id || ''}`)} className="primary-button disabled:opacity-40"><FileText className="h-4 w-4" />Save and go to reporting</button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead><tr><th>No.</th><th>Patient</th><th>Visit date</th><th>Referral doctor</th><th>Notes</th><th>Action</th></tr></thead>
              <tbody>{visits.map((visit, index) => <tr key={visit.id || index}><td>{index + 1}</td><td><div className="font-medium text-slate-900">{visit.patient_display_id || patient?.patient_id}</div><div className="text-xs text-slate-500">{visit.patient_name || `${patient?.first_name || ''} ${patient?.last_name || ''}`}</div></td><td>{visit.visit_date ? new Date(visit.visit_date).toLocaleString() : '-'}</td><td>{visit.referral_doctor || '—'}</td><td>{visit.notes || '—'}</td><td><button type="button" onClick={() => deleteVisit(visit.id)} className="rounded p-2 text-red-600 hover:bg-red-50" title="Delete visit"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody>
            </table>
            {!loading && !visits.length && <p className="py-10 text-center text-sm text-slate-500">Select a patient or add their first visit.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2"><Activity className="h-5 w-5 text-teal-600" /><h2 className="font-semibold text-slate-900">List of scans</h2></div>
          <div className="space-y-2">{['Adult Echo', 'Fetal Echo', 'Pediatric Echo'].map((type) => <button type="button" key={type} disabled={!selectedPatient} onDoubleClick={() => openEcho(type)} title={`Double-click to open ${type}`} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-left transition hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"><span><span className="block text-sm font-medium text-slate-700">{type}</span><span className="mt-0.5 block text-[11px] text-slate-400">Double-click to open</span></span><span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">{scans.filter((scan) => scan.scan_type === type).length}</span></button>)}</div>
          <button type="button" disabled={!selectedPatient} onClick={() => navigate('/echo-studies')} className="primary-button mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"><Calendar className="h-4 w-4" />Go to scan</button>
        </section>
      </div>
      <ReferralDoctorModal open={referralOpen} onClose={() => setReferralOpen(false)} onSaved={() => {}} onSelect={(record) => setVisitData({...visitData, referral_doctor: record.doctor_type === 'hospital' ? record.institution_name : `${record.first_name || ''} ${record.last_name || ''}`.trim()})} />
    </div>
  )
}

function PatientField({ label, value, wide }) {
  return <label className={`field-label ${wide ? 'sm:col-span-2' : ''}`}><span>{label}</span><div className="field-control flex items-center bg-slate-50 text-slate-700">{value || '—'}</div></label>
}
