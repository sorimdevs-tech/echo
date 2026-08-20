import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Pencil, Save, Search, Stethoscope, Trash2, Upload, UserCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { patientService } from '../api/patientService'
import { workspaceService } from '../api/workspaceService'
import { referralDoctorService } from '../api/referralDoctorService'
import ReferralDoctorModal from '../components/ReferralDoctorModal'
import ConfiguredFields from '../components/ConfiguredFields'

const scanRoutes = {
  'Adult Echo': '/adult-echo-report',
  'Fetal Echo': '/fetal-echo-report',
  'Pediatric Echo': '/pediatric-echo-report',
}

const defaultVisitData = {
  visit_date: '',
  visit_type: 'Consultation',
  scan_type: 'Fetal Echo',
  referral_doctor: '',
  report_template_id: '',
  documentation_name: '',
  documentation_path: '',
  custom_fields: {},
}

const getPatientName = (patient) => [patient?.salutation, patient?.first_name, patient?.middle_name, patient?.last_name]
  .filter(Boolean)
  .join(' ')
  .trim()

export default function Visits() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const patientParam = searchParams.get('patient') || searchParams.get('patientId') || searchParams.get('patient_id') || ''
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedVisit, setSelectedVisit] = useState('')
  const [editingVisitId, setEditingVisitId] = useState(null)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [templates, setTemplates] = useState([])
  const [referralDoctors, setReferralDoctors] = useState([])
  const [referralOpen, setReferralOpen] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [showVisits, setShowVisits] = useState(Boolean(patientParam))
  const [visitFilter, setVisitFilter] = useState('All')
  const [visitData, setVisitData] = useState(defaultVisitData)

  useEffect(() => {
    Promise.all([patientService.getPatients(), workspaceService.getTemplates(), referralDoctorService.getReferralDoctors()])
      .then(([patientResult, templateResult, doctorResult]) => {
        const patientList = patientResult.data || []
        setPatients(patientList)
        setTemplates(templateResult.data || [])
        setReferralDoctors(doctorResult.data || [])
        if (patientParam) {
          const found = patientList.find(
            (p) => String(p.id) === String(patientParam) || String(p.patient_id) === String(patientParam)
          )
          if (found) selectPatient(found.id, true)
        }
      })
      .catch(() => { setPatients([]); setTemplates([]); setReferralDoctors([]) })
  }, [patientParam])

  const selectPatient = async (patientId, revealVisits = false) => {
    setSelectedPatient(patientId)
    setSelectedVisit('')
    setEditingVisitId(null)
    setVisitData(defaultVisitData)
    setStatus('')
    setShowVisits(Boolean(revealVisits))
    if (!patientId) {
      setVisits([])
      return
    }
    setLoading(true)
    try {
      const visitResult = await patientService.getVisits(patientId)
      setVisits(visitResult.data || [])
    } catch {
      setVisits([])
    } finally {
      setLoading(false)
    }
  }

  const openVisit = (visit) => {
    if (!selectedPatient || !visit?.id) return
    const route = scanRoutes[visit.scan_type] || '/fetal-echo-report'
    navigate(`${route}?patientId=${selectedPatient}&visitId=${visit.id}&scatter=true`)
  }

  const selectVisit = (visitId) => {
    setSelectedVisit(visitId)
    const visit = visits.find((item) => String(item.id) === String(visitId))
    if (visit) openVisit(visit)
  }

  const addVisit = async (event) => {
    event.preventDefault()
    if (!selectedPatient) {
      alert('Please select a patient')
      return
    }
    const selectedPatientRecord = patients.find((item) => String(item.id) === String(selectedPatient))
    if (!selectedPatientRecord) {
      alert('The selected patient record could not be found')
      return
    }
    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...visitData,
        patient_id: selectedPatient,
        patient_display_id: selectedPatientRecord.patient_id,
        patient_name: getPatientName(selectedPatientRecord),
      }
      const result = editingVisitId
        ? await patientService.updateVisit(selectedPatient, editingVisitId, payload)
        : await patientService.addVisit(selectedPatient, payload)
      const createdVisit = result.data
      setVisits((current) => editingVisitId ? current.map((visit) => visit.id === editingVisitId ? createdVisit : visit) : [createdVisit, ...current])
      setVisitData(defaultVisitData)
      const wasEditing = Boolean(editingVisitId)
      setEditingVisitId(null)
      setShowVisits(true)
      setStatus(wasEditing ? 'Visit details updated.' : `Visit added for ${selectedPatientRecord.patient_id} — ${getPatientName(selectedPatientRecord)}`)
      if (!wasEditing) openVisit(createdVisit)
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to add visit')
    } finally {
      setSaving(false)
    }
  }

  const uploadDocumentation = async (file) => {
    if (!file) return
    setUploadingDocument(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await workspaceService.uploadMedia(formData)
      const document = result.data || {}
      setVisitData((current) => ({
        ...current,
        documentation_name: document.filename || file.name,
        documentation_path: document.url || document.path || '',
      }))
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to upload the document')
    } finally {
      setUploadingDocument(false)
    }
  }

  const referralDoctorLabel = (record) => {
    if (record.doctor_type === 'hospital') return record.institution_name || record.name || 'Hospital'
    return `${record.salutation || ''} ${record.first_name || ''} ${record.last_name || ''}`.trim() || record.name || 'Referral doctor'
  }

  const deleteVisit = async (visitId) => {
    if (!selectedPatient || !visitId) return
    await patientService.deleteVisit(selectedPatient, visitId)
    setVisits(visits.filter((visit) => visit.id !== visitId))
    setStatus('Visit removed from this patient')
  }

  const editVisit = (visit) => {
    setEditingVisitId(visit.id)
    setVisitData({
      visit_date: visit.visit_date ? new Date(visit.visit_date).toISOString().slice(0, 16) : '',
      visit_type: visit.visit_type || 'Consultation',
      scan_type: visit.scan_type || 'Fetal Echo',
      referral_doctor: visit.referral_doctor || '',
      report_template_id: visit.report_template_id || '',
      documentation_name: visit.documentation_name || '',
      documentation_path: visit.documentation_path || '',
      custom_fields: visit.custom_fields || {},
    })
    setShowVisits(true)
    setStatus(`Editing visit #${visit.id}`)
  }

  const patient = patients.find((item) => String(item.id) === String(selectedPatient))
  const filteredVisits = visits.filter((visit) => visitFilter === 'All' || visit.scan_type === visitFilter)

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-end">
          <div className="field-label flex-1">
            <span>Select patient</span>
            <select
              aria-label="Patient selector"
              className="field-control w-full bg-white"
              value={selectedPatient}
              onChange={(event) => selectPatient(event.target.value, false)}
            >
              <option value="">Select a patient</option>
              {patients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.patient_id || `PAT${item.id}`} — {getPatientName(item) || 'Unnamed patient'}
                </option>
              ))}
            </select>
          </div>
          <div className="field-label flex-1">
            <span>Open an existing visit</span>
            <select
              aria-label="Visit selector"
              className="field-control w-full bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              value={selectedVisit}
              disabled={!patient || loading || visits.length === 0}
              onChange={(event) => selectVisit(event.target.value)}
            >
              <option value="">
                {!patient ? 'Select a patient first' : visits.length ? 'Select a visit to open' : 'No visits for this patient'}
              </option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.visit_date ? new Date(visit.visit_date).toLocaleString() : 'Date not recorded'} — {visit.visit_type || 'Consultation'} — {visit.scan_type || 'Fetal Echo'}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="primary-button" disabled={!patient} onClick={() => setShowVisits(true)}>
            <Calendar className="h-4 w-4" />Visits
          </button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Visit creation</h2>
            <p className="text-xs text-slate-500">Create one visit, select its scan/report type, then continue directly to the matching report.</p>
          </div>
          {loading && <span className="text-xs text-teal-700">Loading…</span>}
        </div>
        {patient ? (
          <div className="flex items-center gap-3 border-b border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
            <UserCheck className="h-5 w-5 text-primary-600" />
            <span>New visits will be linked to <strong>{patient.patient_id} — {getPatientName(patient)}</strong></span>
          </div>
        ) : (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select a patient above before adding a visit.</div>
        )}
        {status && <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4" />{status}</div>}

        <form onSubmit={addVisit} className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 lg:grid-cols-3">
          <label className="field-label">
            <span>Visit date and time *</span>
            <input required disabled={!patient || saving} type="datetime-local" className="field-control disabled:bg-slate-100" value={visitData.visit_date} onChange={(event) => setVisitData({ ...visitData, visit_date: event.target.value })} />
          </label>
          <label className="field-label">
            <span>Visit type</span>
            <select disabled={!patient || saving} className="field-control disabled:bg-slate-100" value={visitData.visit_type} onChange={(event) => setVisitData({ ...visitData, visit_type: event.target.value })}>
              <option>Consultation</option>
              <option>Follow-up</option>
              <option>Review</option>
              <option>Procedure</option>
            </select>
          </label>
          <label className="field-label">
            <span>Scan type</span>
            <select disabled={!patient || saving} className="field-control disabled:bg-slate-100" value={visitData.scan_type} onChange={(event) => setVisitData({ ...visitData, scan_type: event.target.value })}>
              <option>Fetal Echo</option>
              <option>Adult Echo</option>
              <option>Pediatric Echo</option>
            </select>
          </label>
          <label className="field-label">
            <span>Report template</span>
            <select disabled={!patient || saving} className="field-control disabled:bg-slate-100" value={visitData.report_template_id} onChange={(event) => setVisitData({ ...visitData, report_template_id: event.target.value })}>
              <option value="">Select template</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.title || template.name || template.scan_type}</option>)}
            </select>
          </label>
          <label className="field-label">
            <span>Referral doctor</span>
            <div className="flex gap-2">
              <select disabled={!patient || saving} className="field-control disabled:bg-slate-100" value={visitData.referral_doctor} onChange={(event) => setVisitData({ ...visitData, referral_doctor: event.target.value })}>
                <option value="">Select referral doctor</option>
                {referralDoctors.map((doctor) => {
                  const label = referralDoctorLabel(doctor)
                  return <option key={doctor.id} value={label}>{label}</option>
                })}
              </select>
              <button type="button" disabled={!patient || saving} onClick={() => setReferralOpen(true)} className="secondary-button whitespace-nowrap disabled:opacity-40"><Stethoscope className="h-4 w-4" />Manage</button>
            </div>
          </label>
          <label className="field-label">
            <span>Documentation</span>
            <label className="field-control flex cursor-pointer items-center gap-2 bg-white text-slate-600">
              <Upload className="h-4 w-4" />
              <span className="truncate">{uploadingDocument ? 'Uploading document…' : visitData.documentation_name || 'Upload document'}</span>
              <input disabled={!patient || saving || uploadingDocument} type="file" className="hidden" onChange={(event) => uploadDocumentation(event.target.files?.[0])} />
            </label>
          </label>
          <div className="lg:col-span-3">
            <ConfiguredFields module="Visits" values={visitData.custom_fields} onChange={(custom_fields) => setVisitData({ ...visitData, custom_fields })} disabled={!patient || saving} />
          </div>
          <button disabled={!patient || saving || uploadingDocument || !visitData.visit_date} className="primary-button self-end justify-center disabled:cursor-not-allowed disabled:opacity-40">
            <Save className="h-4 w-4" />{saving ? 'Saving…' : editingVisitId ? 'Update Visit' : 'Add Visit'}
          </button>
        </form>
      </section>

      {showVisits ? (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Visits</h2>
              <p className="text-xs text-slate-500">Click a visit to open its linked report directly.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['All', 'Adult Echo', 'Fetal Echo', 'Pediatric Echo'].map((type) => (
                <button key={type} type="button" onClick={() => setVisitFilter(type)} className={`rounded-lg px-3 py-1 text-xs font-semibold ${visitFilter === type ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[860px]">
              <thead><tr><th>No.</th><th>Patient</th><th>Visit date</th><th>Visit type</th><th>Scan type</th><th>Referral doctor</th><th>Documentation</th><th>Action</th></tr></thead>
              <tbody>
                {filteredVisits.map((visit, index) => (
                  <tr key={visit.id || index} onClick={() => openVisit(visit)} className="cursor-pointer transition hover:bg-teal-50/60" title="Open this visit">
                    <td>{index + 1}</td>
                    <td><div className="font-medium text-slate-900">{patient?.patient_id}</div><div className="text-xs text-slate-500">{getPatientName(patient)}</div></td>
                    <td>{visit.visit_date ? new Date(visit.visit_date).toLocaleString() : '-'}</td>
                    <td>{visit.visit_type || 'Consultation'}</td>
                    <td>{visit.scan_type || 'Fetal Echo'}</td>
                    <td>{visit.referral_doctor || '—'}</td>
                    <td>{visit.documentation_path ? <a href={visit.documentation_path} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="font-medium text-teal-700 hover:underline">{visit.documentation_name || 'Open document'}</a> : visit.documentation_name || '—'}</td>
                    <td><div className="flex items-center gap-1"><button type="button" onClick={(e) => { e.stopPropagation(); editVisit(visit) }} className="rounded p-2 text-teal-700 hover:bg-teal-50" title="Edit visit"><Pencil className="h-4 w-4" /></button><button type="button" onClick={(e) => { e.stopPropagation(); deleteVisit(visit.id) }} className="rounded p-2 text-red-600 hover:bg-red-50" title="Delete visit"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredVisits.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No visits match the selected patient/filter.</p>}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">Select a patient, then click Visits to show their visit history.</p>
        </section>
      )}

      <ReferralDoctorModal open={referralOpen} onClose={() => setReferralOpen(false)} onSaved={() => referralDoctorService.getReferralDoctors().then((result) => setReferralDoctors(result.data || []))} onSelect={(record) => setVisitData({ ...visitData, referral_doctor: referralDoctorLabel(record) })} />
    </div>
  )
}

function PatientField({ label, value, wide }) {
  return <label className={`field-label ${wide ? 'sm:col-span-2' : ''}`}><span>{label}</span><div className="field-control flex items-center bg-slate-50 text-slate-700">{value || '—'}</div></label>
}
