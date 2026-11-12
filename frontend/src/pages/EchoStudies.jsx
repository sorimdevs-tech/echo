import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Plus, Search } from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

export default function EchoStudies() {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [patients, setPatients] = useState([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([scanService.getScans(), patientService.getPatients()])
      .then(([scanResult, patientResult]) => {
        setScans(scanResult.data || [])
        setPatients(patientResult.data || [])
      })
      .catch(() => setError('Echo studies could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  const patientMap = useMemo(() => new Map(patients.map((patient) => [String(patient.id), patient])), [patients])
  const rows = useMemo(() => scans.filter((scan) => {
    const patient = patientMap.get(String(scan.patient_id)) || {}
    const haystack = `${patient.patient_id || scan.patient_display_id || ''} ${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase()
    return (type === 'All' || scan.scan_type === type) && haystack.includes(query.toLowerCase())
  }), [scans, patientMap, query, type])

  return (
    <div className="space-y-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Echo studies</p><h1 className="text-2xl font-bold text-slate-950">Study workspace</h1><p className="mt-1 text-sm text-slate-500">Open an existing study or start a new unified echo scan.</p></div>
        <button type="button" onClick={() => navigate('/visits')} className="primary-button"><Plus className="h-4 w-4" />Create from visit</button>
      </div>
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="relative min-w-64 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient or ID" className="field-control pl-9" /></label>
        <select aria-label="Scan type" className="field-control w-48" value={type} onChange={(event) => setType(event.target.value)}><option>All</option><option>Adult Echo</option><option>Pediatric Echo</option><option>Fetal Echo</option><option>Ultrasound</option></select>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p role="status">Loading studies…</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="data-table min-w-[760px]"><thead><tr><th>Patient</th><th>Study</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>
          {rows.map((scan) => { const patient = patientMap.get(String(scan.patient_id)) || {}; return <tr key={scan.id}><td>{`${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown'}<div className="text-xs text-slate-500">{patient.patient_id || scan.patient_display_id || '—'}</div></td><td>{scan.scan_type || 'Echo'}</td><td>{scan.status || 'Draft'}</td><td>{scan.scan_date ? new Date(scan.scan_date).toLocaleDateString() : '—'}</td><td><button type="button" onClick={() => navigate(`/echo-scan/${scan.id}`)} className="secondary-button"><Activity className="h-4 w-4"/>Open study</button></td></tr> })}
          {!loading && !error && !rows.length && <tr><td colSpan="5" className="py-10 text-center text-slate-500">No studies match the selected filters.</td></tr>}
        </tbody></table>
      </div>
    </div>
  )
}
