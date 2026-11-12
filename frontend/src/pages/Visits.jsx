import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Activity,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Filter,
  Plus,
  Save,
  Search,
  Stethoscope,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'
import { referralDoctorService } from '../api/referralDoctorService'
import { workspaceService } from '../api/workspaceService'
import ReferralDoctorModal from '../components/ReferralDoctorModal'
import SearchableSelect from '../components/SearchableSelect'

export default function Visits() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const patientParam =
    searchParams.get('patient') || searchParams.get('patientId') || searchParams.get('patient_id') || ''
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [visits, setVisits] = useState([])
  const [allVisits, setAllVisits] = useState([])
  const [scans, setScans] = useState([])
  const [activeScanFilter, setActiveScanFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [templates, setTemplates] = useState([])
  const [referralOpen, setReferralOpen] = useState(false)
  const [referralDoctors, setReferralDoctors] = useState([])
  const loadReferralDoctors = useCallback(() => referralDoctorService.getReferralDoctors().then(result => setReferralDoctors(result.data || [])).catch(() => setReferralDoctors([])), [])
  useEffect(() => { loadReferralDoctors() }, [loadReferralDoctors])
  const [visitData, setVisitData] = useState({
    visit_date: '',
    scan_type: '',
    referral_doctor: '',
    report_template_id: '',
    notes: '',
  })
  const referralOptions = useMemo(() => {
    const names = ['Self', ...referralDoctors.map(d => d.doctor_type === 'hospital' ? (d.institution_name || d.hospital_name || '') : `${d.first_name || ''} ${d.last_name || ''}`.trim()), visitData.referral_doctor].filter(Boolean)
    return [...new Set(names)].map(name => ({ value: name, label: name }))
  }, [referralDoctors, visitData.referral_doctor])

  // Map visit count for every patient across the entire system
  const visitCountsByPatient = useMemo(() => {
    const map = {}
    for (const v of allVisits) {
      const pid = String(v.patient_id)
      map[pid] = (map[pid] || 0) + 1
    }
    return map
  }, [allVisits])

  // Patient options for SearchableSelect with real-time visit count badges
  const patientOptions = useMemo(() => {
    return patients.map((item) => {
      const countFromId = visitCountsByPatient[String(item.id)] || 0
      const countFromPatientId = visitCountsByPatient[String(item.patient_id)] || 0
      const vCount = item.visit_count || countFromId || countFromPatientId || 0
      const visitLabel = vCount === 1 ? '1 visit' : `${vCount} visits`
      return {
        value: item.id,
        label: `${item.patient_id || ''} — ${item.first_name || ''} ${item.last_name || ''}`.trim(),
        badge: visitLabel,
        visitCount: vCount,
      }
    })
  }, [patients, visitCountsByPatient])

  // Initial data fetch
  useEffect(() => {
    Promise.all([
      patientService.getPatients(),
      workspaceService.getTemplates(),
      patientService.getAllVisits().catch(() => ({ data: [] })),
    ])
      .then(([patientResult, templateResult, allVisitsResult]) => {
        const patientList = patientResult.data || []
        setPatients(patientList)
        setTemplates(templateResult.data || [])
        setAllVisits(allVisitsResult.data || [])
      })
      .catch(() => {
        setPatients([])
        setTemplates([])
        setAllVisits([])
      })
  }, [])

  // Sync selected patient when URL patientParam or patientList changes
  useEffect(() => {
    if (!patients.length) return
    if (patientParam) {
      const found = patients.find(
        (p) => String(p.id) === String(patientParam) || String(p.patient_id) === String(patientParam)
      )
      if (found && String(found.id) !== String(selectedPatient)) {
        selectPatient(found.id, false)
      }
    }
  }, [patientParam, patients, selectedPatient])

  const selectPatient = async (patientId, syncUrl = true) => {
    setSelectedPatient(patientId)
    const chosenPatient = patients.find(item => String(item.id) === String(patientId))
    setVisitData({ visit_date: '', scan_type: '', referral_doctor: chosenPatient?.family_doctor || '', report_template_id: '', notes: '' })
    setActiveScanFilter('')
    setStatus('')

    // Immediately keep browser URL query parameter in sync
    if (syncUrl) {
      if (patientId) {
        setSearchParams({ patient: String(patientId) }, { replace: true })
      } else {
        setSearchParams({}, { replace: true })
      }
    }

    if (!patientId) {
      setVisits([])
      setScans([])
      return
    }
    setLoading(true)
    try {
      const [visitResult, scanResult] = await Promise.all([
        patientService.getVisits(patientId),
        scanService.getScansByPatient(patientId),
      ])
      setVisits(visitResult.data || [])
      setScans(scanResult.data || [])
    } catch {
      setVisits([])
      setScans([])
    } finally {
      setLoading(false)
    }
  }

  // Determine intelligent default scan type for current patient
  const defaultScanType = useMemo(() => {
    if (activeScanFilter) return activeScanFilter
    if (scans.length > 0 && scans[0].scan_type) return scans[0].scan_type
    const patientRecord = patients.find((p) => String(p.id) === String(selectedPatient))
    if (patientRecord?.age !== undefined && patientRecord?.age !== null && Number(patientRecord.age) < 18) {
      return 'Pediatric Echo'
    }
    return 'Adult Echo'
  }, [activeScanFilter, scans, patients, selectedPatient])

  useEffect(() => {
    const scanType = visitData.scan_type
    if (!scanType || visitData.report_template_id) return
    const matchingTemplate = templates.find((template) => template.scan_type === scanType)
    if (!matchingTemplate) return
    setVisitData((current) => current.report_template_id === String(matchingTemplate.id)
      ? current
      : { ...current, scan_type: current.scan_type || scanType, report_template_id: String(matchingTemplate.id) })
  }, [defaultScanType, templates, visitData.scan_type, visitData.report_template_id])

  const openVisitReport = (visit, selectedType) => {
    if (!visit) return
    const scan = scans.find((item) => String(item.visit_id) === String(visit.id) && (!selectedType || item.scan_type === selectedType))
    const template = templates.find((item) => String(item.id) === String(visit.report_template_id))
    const knownTypes = ['Adult Echo', 'Fetal Echo', 'Pediatric Echo', 'Ultrasound']
    const scanType = [selectedType, visit.scan_type, visit.visit_type, scan?.scan_type, template?.scan_type, activeScanFilter].find((type) => knownTypes.includes(type)) || 'Adult Echo'
    const route = {
      'Adult Echo': 'adult-echo-report',
      'Fetal Echo': 'fetal-echo-report',
      'Pediatric Echo': 'pediatric-echo-report',
      'Ultrasound': 'echo-scan',
    }[scanType]
    if (!route) {
      navigate(`/echo-studies?patient=${selectedPatient}&visit=${visit.id}&type=${encodeURIComponent(scanType)}`)
      return
    }
    const query = new URLSearchParams({ patientId: String(selectedPatient), visitId: String(visit.id) })
    if (scanType === 'Ultrasound') query.set('type', scanType)
    navigate(`/${route}${scan?.id ? `/${scan.id}` : ''}?${query}`)
  }

  // Determine which scan types a visit belongs to
  const getVisitScanTypes = useCallback(
    (visit) => {
      const types = new Set()
      if (!visit) return []

      // 1. Direct match via scans table visit_id
      for (const s of scans) {
        if (s.scan_type && String(s.visit_id) === String(visit.id)) {
          types.add(s.scan_type)
        }
      }

      // 2. Match via chosen template
      if (visit.report_template_id) {
        const tmpl = templates.find((t) => String(t.id) === String(visit.report_template_id))
        if (tmpl?.scan_type) types.add(tmpl.scan_type)
      }

      // 3. Match via visit_type, notes, diagnosis, or ob text
      const visitType = (visit.visit_type || '').toLowerCase()
      if (visitType.includes('fetal') || visitType.includes('routine fetal scan')) types.add('Fetal Echo')
      if (visitType.includes('pediatric')) types.add('Pediatric Echo')
      if (visitType.includes('adult')) types.add('Adult Echo')
      if (visitType.includes('ultrasound')) types.add('Ultrasound')

      const text = `${visit.notes || ''} ${visit.diagnosis || ''} ${visit.ob || ''}`.toLowerCase()
      if (text.includes('adult echo') || text.includes('adult')) types.add('Adult Echo')
      if (text.includes('fetal echo') || text.includes('fetal')) types.add('Fetal Echo')
      if (text.includes('pediatric echo') || text.includes('pediatric')) types.add('Pediatric Echo')

      // 4. Fallback: If visit still has no explicit scan type, inherit from patient's scans or age
      if (types.size === 0) {
        if (scans.length > 0) {
          const uniquePatientScanTypes = Array.from(new Set(scans.map((s) => s.scan_type).filter(Boolean)))
          if (uniquePatientScanTypes.length === 1) {
            types.add(uniquePatientScanTypes[0])
          } else {
            for (const s of scans) {
              if (s.scan_type && (!s.visit_id || String(s.visit_id) === String(visit.id))) {
                types.add(s.scan_type)
              }
            }
          }
        } else {
          const patientRecord = patients.find((p) => String(p.id) === String(selectedPatient))
          if (patientRecord?.age !== undefined && patientRecord?.age !== null && Number(patientRecord.age) < 18) {
            types.add('Pediatric Echo')
          } else {
            types.add('Adult Echo')
          }
        }
      }

      return Array.from(types)
    },
    [scans, templates, patients, selectedPatient],
  )

  // Filter visits based on active scan filter
  const filteredVisits = useMemo(() => {
    if (!activeScanFilter) return visits
    return visits.filter((v) => getVisitScanTypes(v).includes(activeScanFilter))
  }, [visits, activeScanFilter, getVisitScanTypes])

  const toggleScanFilter = (type) => {
    setActiveScanFilter((prev) => (prev === type ? '' : type))
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
    const selectedTmpl = templates.find((t) => String(t.id) === String(visitData.report_template_id))
    const determinedScanType = visitData.scan_type
    if (!visitData.visit_date || !determinedScanType || !selectedTmpl || selectedTmpl.scan_type !== determinedScanType) {
      setStatus('Select a scan type, its matching report template, and a visit date.')
      return
    }
    setSaving(true)
    setStatus('')
    try {
      const result = await patientService.addVisit(selectedPatient, {
        ...visitData,
        patient_id: selectedPatient,
        patient_display_id: selectedPatientRecord.patient_id,
        patient_name: `${selectedPatientRecord.first_name || ''} ${selectedPatientRecord.last_name || ''}`.trim(),
        scan_type: determinedScanType,
        visit_type: determinedScanType,
        report_template_id: Number(visitData.report_template_id),
      })
      const newVisit = result.data

      setVisits([newVisit, ...visits])
      setAllVisits([newVisit, ...allVisits])
      setVisitData({ visit_date: '', scan_type: '', referral_doctor: '', report_template_id: '', notes: '' })
      openVisitReport(newVisit, determinedScanType)
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to add visit')
    } finally {
      setSaving(false)
    }
  }

  const deleteVisit = async (visitId) => {
    if (!selectedPatient || !visitId) return
    await patientService.deleteVisit(selectedPatient, visitId)
    setVisits(visits.filter((visit) => visit.id !== visitId))
    setAllVisits(allVisits.filter((visit) => visit.id !== visitId))
    setScans(scans.filter((scan) => String(scan.visit_id) !== String(visitId)))
    setStatus('Visit removed from this patient')
  }

  const patient = patients.find((item) => String(item.id) === String(selectedPatient))

  const openEcho = (type) => {
    if (!selectedPatient) return
    const matchingScan = scans.find((scan) => scan.scan_type === type)
    const visitId = matchingScan?.visit_id || visits[0]?.id || ''
    const visit = visits.find((item) => String(item.id) === String(visitId))
    if (visit) openVisitReport(visit, type)
  }

  const handleGoToScan = () => {
    if (!selectedPatient) return
    if (activeScanFilter) {
      const matchingScan = scans.find((s) => s.scan_type === activeScanFilter)
      const visitId = matchingScan?.visit_id || visits[0]?.id || ''
      const visit = visits.find((item) => String(item.id) === String(visitId))
      if (visit) openVisitReport(visit, activeScanFilter)
    } else {
      navigate(`/echo-studies?patient=${selectedPatient}`)
    }
  }

  const getScanBadgeClass = (scanType) => {
    if (scanType === 'Adult Echo') return 'bg-sky-50 text-sky-700 border-sky-200'
    if (scanType === 'Fetal Echo') return 'bg-purple-50 text-purple-700 border-purple-200'
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return (
    <div className="space-y-3">
      {/* Patient Selector & Info Card */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-end">
          <div className="field-label flex-1">
            <span className="flex items-center gap-2">
              <span>Select patient</span>
              {selectedPatient && (
                <span className="text-xs font-normal text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  {visits.length} {visits.length === 1 ? 'visit' : 'visits'} recorded
                </span>
              )}
            </span>
            <SearchableSelect
              options={patientOptions}
              value={selectedPatient}
              onChange={(val) => selectPatient(val, true)}
              placeholder="Search or select a patient"
              searchPlaceholder="Search patient ID, name, or visits..."
            />
          </div>
          <button type="button" className="secondary-button" onClick={() => navigate('/patients/new')}>
            <Plus className="h-4 w-4" />
            New patient
          </button>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[1fr_180px]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PatientField label="Patient ID" value={patient?.patient_id} />
            <PatientField label="First name" value={patient?.first_name} />
            <PatientField label="Last name" value={patient?.last_name} />
            <PatientField label="Aadhaar number" value={patient?.aadhaar_no} />
            <PatientField label="Gender" value={patient?.gender} />
            <PatientField
              label="Age"
              value={patient?.age ? `${patient.age} ${patient.age_unit || 'Years'}` : ''}
            />
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
            <PatientField label="Referral Doctor / Institute" value={patient?.family_doctor} wide />
          </div>
          <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            {patient ? (
              <QRCodeSVG
                value={JSON.stringify({
                  id: patient.id,
                  patient_id: patient.patient_id,
                  name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
                })}
                size={112}
                level="M"
                includeMargin
              />
            ) : (
              <div className="h-28 w-28 rounded-lg border-2 border-dashed border-slate-300" />
            )}
            <span className="mt-2 text-xs font-medium text-slate-500">
              {patient?.patient_id || 'Patient QR code'}
            </span>
          </div>
        </div>
      </section>

      {/* Main Visits Section + List of Scans Sidebar */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left: Visits Management Table */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                <span>Visits ({visits.length})</span>
              </h2>
              <p className="text-xs text-slate-500">Add and review clinical visits for the selected patient.</p>
            </div>
            {loading && <span className="text-xs font-medium text-teal-700 animate-pulse">Loading visits…</span>}
          </div>

          {patient ? (
            <div className="flex items-center gap-3 border-b border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
              <UserCheck className="h-5 w-5 text-primary-600 shrink-0" />
              <span>
                New visits will be linked to{' '}
                <strong>
                  {patient.patient_id} — {patient.first_name} {patient.last_name}
                </strong>
              </span>
            </div>
          ) : (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Select a patient above before adding a visit.
            </div>
          )}

          {status && (
            <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{status}</span>
            </div>
          )}

          {/* Active Scan Filter Indicator Banner */}
          {activeScanFilter && (
            <div className="flex items-center justify-between border-b border-teal-200 bg-teal-50/90 px-4 py-2.5 text-xs text-teal-900">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <span>
                  Filtering visits by: <strong className="font-bold">{activeScanFilter}</strong> · Showing{' '}
                  <strong>{filteredVisits.length}</strong> of {visits.length} visits
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveScanFilter('')}
                className="flex items-center gap-1 rounded-md border border-teal-300 bg-white px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition shadow-2xs"
              >
                <X className="h-3 w-3" />
                <span>Show All Visits</span>
              </button>
            </div>
          )}

          {/* Add Visit Form */}
          <form
            onSubmit={addVisit}
            className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 lg:grid-cols-[190px_160px_1fr_1fr_1fr]"
          >
            <label className="field-label">
              <span>Visit date and time<span aria-hidden="true" className="text-red-600"> *</span></span>
              <input
                required
                disabled={!patient || saving}
                type="datetime-local"
                className="field-control disabled:bg-slate-100"
                value={visitData.visit_date}
                onChange={(event) => setVisitData({ ...visitData, visit_date: event.target.value })}
              />
            </label>
            <label className="field-label">
              <span>Scan type<span aria-hidden="true" className="text-red-600"> *</span></span>
              <select
                required
                disabled={!patient || saving}
                className="field-control disabled:bg-slate-100"
                value={visitData.scan_type}
                onChange={(event) => {
                  const scanType = event.target.value
                  const matchingTemplate = templates.find((template) => template.scan_type === scanType)
                  setVisitData((current) => ({
                    ...current,
                    scan_type: scanType,
                    report_template_id: matchingTemplate ? String(matchingTemplate.id) : '',
                  }))
                }}
              >
                <option value="">Select examination</option>
                <option value="Adult Echo">Adult Echo</option>
                <option value="Fetal Echo">Fetal Echo</option>
                <option value="Pediatric Echo">Pediatric Echo</option>
                <option value="Ultrasound">Ultrasound</option>
              </select>
            </label>
            <label className="field-label">
              <span>Report template<span aria-hidden="true" className="text-red-600"> *</span></span>
              <select
                required
                disabled={!patient || saving}
                className="field-control disabled:bg-slate-100"
                value={visitData.report_template_id}
                onChange={(event) => {
                  const tmplId = event.target.value
                  const tmpl = templates.find((t) => String(t.id) === String(tmplId))
                  setVisitData((prev) => ({
                    ...prev,
                    report_template_id: tmplId,
                    scan_type: tmpl?.scan_type || prev.scan_type,
                  }))
                }}
              >
                <option value="">Select template</option>
                {templates.filter((template) => template.scan_type === visitData.scan_type).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title || template.name || template.scan_type}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-label"><span>Referral Doctor / Institute</span><SearchableSelect options={referralOptions} value={visitData.referral_doctor} onChange={value => setVisitData(current => ({ ...current, referral_doctor: value }))} disabled={!patient || saving} placeholder="Select doctor or institute" /></div>
            <label className="field-label">
              <span>Visit notes</span>
              <input
                disabled={!patient || saving}
                className="field-control disabled:bg-slate-100"
                placeholder={activeScanFilter ? `e.g., ${activeScanFilter} examination` : 'Visit notes'}
                value={visitData.notes}
                onChange={(event) => setVisitData({ ...visitData, notes: event.target.value })}
              />
            </label>
            <div className="flex flex-wrap gap-2 lg:col-span-full"><button
              disabled={!patient || saving || !visitData.visit_date || !visitData.scan_type || !visitData.report_template_id}
              className="primary-button self-end disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save & Go to Reporting'}
            </button><button type="button" disabled={!patient} onClick={() => setReferralOpen(true)} className="secondary-button disabled:opacity-40"><Stethoscope className="h-4 w-4" />New referral doctor</button></div>
          </form>

          {/* Visits Table */}
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Patient</th>
                  <th>Visit date</th>
                  <th>Scan Type</th>
                  <th>Referral doctor</th>
                  <th>Notes / Report status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit, index) => {
                  const visitTypes = getVisitScanTypes(visit)
                  return (
                    <tr
                      key={visit.id || index}
                      onClick={() => openVisitReport(visit)}
                      title="Click to open this visit's report"
                      className="cursor-pointer transition hover:bg-teal-50/60"
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="font-medium text-slate-900">
                          {visit.patient_display_id || patient?.patient_id}
                        </div>
                        <div className="text-xs text-slate-500">
                          {visit.patient_name || `${patient?.first_name || ''} ${patient?.last_name || ''}`}
                        </div>
                      </td>
                      <td>{visit.visit_date ? new Date(visit.visit_date).toLocaleString() : '-'}</td>
                      <td>
                        {visitTypes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {visitTypes.map((st) => (
                              <span
                                key={st}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                  st === activeScanFilter
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                    : getScanBadgeClass(st)
                                }`}
                              >
                                {st}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td>{visit.referral_doctor || '—'}</td>
                      <td><div>{visit.notes || '—'}</div>{(() => { const scan = scans.find(item => String(item.visit_id) === String(visit.id)); return scan ? <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${String(scan.status).toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{scan.status || 'Draft'}</span> : <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">No report</span> })()}</td>
                      <td>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteVisit(visit.id)
                          }}
                          className="rounded p-2 text-red-600 hover:bg-red-50"
                          title="Delete visit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {!loading && visits.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                {selectedPatient
                  ? 'No visits recorded yet for this patient. Add their first visit above.'
                  : 'Select a patient above to view their visits.'}
              </p>
            )}

            {!loading && visits.length > 0 && filteredVisits.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500 space-y-2">
                <p>No visits found matching &quot;{activeScanFilter}&quot; for this patient.</p>
                <button
                  type="button"
                  onClick={() => setActiveScanFilter('')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 underline"
                >
                  Clear filter and show all {visits.length} visits
                </button>
              </div>
            )}
          </div>
        </section>


      </div>

      <ReferralDoctorModal
        open={referralOpen}
        onClose={() => setReferralOpen(false)}
        onSaved={loadReferralDoctors}
        onSelect={(record) =>
          setVisitData({
            ...visitData,
            referral_doctor:
              record.doctor_type === 'hospital'
                ? record.institution_name
                : `${record.first_name || ''} ${record.last_name || ''}`.trim(),
          })
        }
      />
    </div>
  )
}

function PatientField({ label, value, wide }) {
  return (
    <label className={`field-label ${wide ? 'sm:col-span-2' : ''}`}>
      <span>{label}</span>
      <div className="field-control flex items-center bg-slate-50 text-slate-700">{value || '—'}</div>
    </label>
  )
}
