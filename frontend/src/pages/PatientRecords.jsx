import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ClipboardList, Edit3, FileText, HeartPulse, Stethoscope } from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

const reportRoutes = {
  'Adult Echo': '/adult-echo-report',
  'Fetal Echo': '/fetal-echo-report',
  'Pediatric Echo': '/pediatric-echo-report',
}

const displayPatientName = (patient) => [patient?.salutation, patient?.first_name, patient?.middle_name, patient?.last_name]
  .filter(Boolean)
  .join(' ')
  .trim() || 'Patient'

const displayDate = (value) => {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const reportRouteFor = (scanType) => reportRoutes[scanType] || '/fetal-echo-report'

export default function PatientRecords() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [visits, setVisits] = useState([])
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([
      patientService.getPatient(id),
      patientService.getVisits(id),
      scanService.getScansByPatient(id),
    ])
      .then(([patientResult, visitsResult, scansResult]) => {
        if (!active) return
        setPatient(patientResult.data || null)
        setVisits(visitsResult.data || [])
        setScans(scansResult.data || [])
      })
      .catch(() => {
        if (active) setError('Unable to load this patient record.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [id])

  const disciplineCounts = useMemo(() => ({
    'Adult Echo': scans.filter((scan) => scan.scan_type === 'Adult Echo').length,
    'Fetal Echo': scans.filter((scan) => scan.scan_type === 'Fetal Echo').length,
    'Pediatric Echo': scans.filter((scan) => scan.scan_type === 'Pediatric Echo').length,
  }), [scans])

  const openVisitReport = (visit) => {
    navigate(`${reportRouteFor(visit.scan_type)}?patientId=${id}&visitId=${visit.id}&scatter=true`)
  }

  const openScanReport = (scan) => {
    navigate(`${reportRouteFor(scan.scan_type)}/${scan.id}?patientId=${id}&visitId=${scan.visit_id || ''}&scatter=true`)
  }

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading patient records…</div>

  if (error || !patient) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>{error || 'Patient record not found.'}</p>
        <button type="button" className="mt-4 secondary-button" onClick={() => navigate('/patients')}>Back to patients</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <button type="button" onClick={() => navigate('/patients')} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800">
          <ChevronLeft className="h-4 w-4" />Patients
        </button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Patient-level record</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{displayPatientName(patient)}</h1>
            <p className="mt-1 text-sm text-slate-500">{patient.patient_id} · {patient.gender || 'Gender not recorded'} · {patient.age ?? 'Age not recorded'} years</p>
            <p className="mt-1 text-sm text-slate-500">{patient.mobile || patient.phone1 || 'No phone recorded'}{patient.email ? ` · ${patient.email}` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="secondary-button" onClick={() => navigate(`/patients/${id}/edit`)}><Edit3 className="h-4 w-4" />Edit patient</button>
            <button type="button" className="primary-button" onClick={() => navigate(`/visits?patient=${id}`)}><CalendarDays className="h-4 w-4" />Manage visits</button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total visits" value={visits.length} icon={ClipboardList} tone="teal" />
        <SummaryCard label="Adult echo records" value={disciplineCounts['Adult Echo']} icon={HeartPulse} tone="violet" />
        <SummaryCard label="Fetal echo records" value={disciplineCounts['Fetal Echo']} icon={HeartPulse} tone="pink" />
        <SummaryCard label="Pediatric echo records" value={disciplineCounts['Pediatric Echo']} icon={Stethoscope} tone="blue" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">Visit history</h2>
          <p className="mt-1 text-sm text-slate-500">All visits for this patient. Open any visit to continue its associated echo-report workflow.</p>
        </div>
        {visits.length ? (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead><tr><th>Visit date</th><th>Visit type</th><th>Scan type</th><th>Referral doctor</th><th /></tr></thead>
              <tbody>{visits.map((visit) => <tr key={visit.id} className="hover:bg-teal-50/50"><td>{displayDate(visit.visit_date)}</td><td>{visit.visit_type || 'Consultation'}</td><td>{visit.scan_type || 'Fetal Echo'}</td><td>{visit.referral_doctor || '—'}</td><td><button type="button" className="text-sm font-semibold text-teal-700 hover:text-teal-900" onClick={() => openVisitReport(visit)}>Open visit</button></td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="p-8 text-center text-sm text-slate-500">No visits have been recorded for this patient.</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">Echo records</h2>
          <p className="mt-1 text-sm text-slate-500">Adult, fetal, and pediatric echo records are grouped here under the same patient. Each opens in its appropriate editor.</p>
        </div>
        {scans.length ? (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead><tr><th>Scan date</th><th>Echo type</th><th>Status</th><th>Findings</th><th /></tr></thead>
              <tbody>{scans.map((scan) => <tr key={scan.id} className="hover:bg-teal-50/50"><td>{displayDate(scan.scan_date)}</td><td>{scan.scan_type || 'Echo'}</td><td className="capitalize">{scan.status || 'Draft'}</td><td className="max-w-md truncate">{scan.findings || scan.diagnosis || '—'}</td><td><button type="button" className="text-sm font-semibold text-teal-700 hover:text-teal-900" onClick={() => openScanReport(scan)}>Edit record</button></td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="p-8 text-center text-sm text-slate-500">No echo records have been created for this patient yet.</p>}
      </section>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    violet: 'bg-violet-50 text-violet-700',
    pink: 'bg-pink-50 text-pink-700',
    blue: 'bg-blue-50 text-blue-700',
  }

  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-600">{label}</span><span className={`rounded-lg p-2 ${tones[tone]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-2xl font-bold text-slate-900">{value}</p></div>
}
