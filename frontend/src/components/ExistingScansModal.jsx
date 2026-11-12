import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Activity,
  Calendar,
  ExternalLink,
  FolderOpen,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  User,
} from 'lucide-react'
import { scanService } from '../api/scanService'

/**
 * Modal to view and open past / existing scans for a given patient.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string|number} patientId
 * @param {object} patient
 * @param {string|number} currentScanId
 */
export default function ExistingScansModal({
  isOpen,
  onClose,
  patientId,
  patient,
  currentScanId,
}) {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !patientId) return

    let isMounted = true
    setLoading(true)
    setError('')

    scanService
      .getScansByPatient(patientId)
      .then((res) => {
        if (!isMounted) return
        const list = res.data || []
        setScans(list)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load existing scans:', err)
        setError('Unable to load existing scans for this patient.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, patientId])

  if (!isOpen) return null

  const handleOpenScan = (scan) => {
    let route = '/adult-echo-report'
    if (scan.scan_type === 'Fetal Echo') route = '/fetal-echo-report'
    else if (scan.scan_type === 'Pediatric Echo') route = '/pediatric-echo-report'

    onClose()
    navigate(
      `${route}/${scan.id}?patientId=${scan.patient_id}&visitId=${scan.visit_id || ''}&scatter=true`
    )
  }

  const getScanBadgeClass = (scanType) => {
    if (scanType === 'Fetal Echo') return 'bg-teal-50 text-teal-700 border-teal-200'
    if (scanType === 'Pediatric Echo') return 'bg-blue-50 text-blue-700 border-blue-200'
    return 'bg-purple-50 text-purple-700 border-purple-200'
  }

  const getStatusBadge = (status) => {
    const s = String(status || 'draft').toLowerCase()
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      )
    }
    if (s === 'in progress') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <Clock className="h-3 w-3" />
          In Progress
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
        Draft
      </span>
    )
  }

  const patientName = patient
    ? `${patient.salutation || ''} ${patient.first_name || ''} ${patient.last_name || ''}`.trim()
    : 'Selected Patient'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Existing Scans</h2>
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 border border-teal-200">
                  {scans.length} {scans.length === 1 ? 'scan' : 'scans'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>{patientName}</span>
                {patient?.patient_id && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{patient.patient_id}</span>
                  </>
                )}
                {patient?.age && (
                  <>
                    <span>•</span>
                    <span>Age: {patient.age} {patient.age_unit || 'Years'}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (patientId) {
                  setLoading(true)
                  scanService
                    .getScansByPatient(patientId)
                    .then((res) => setScans(res.data || []))
                    .finally(() => setLoading(false))
                }
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Refresh scans"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent"></div>
              <p className="mt-3 text-sm text-slate-500 font-medium">Loading existing scans…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </div>
          ) : scans.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">No Existing Scans Found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No previous echocardiography scans have been recorded for this patient yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Scan Type</th>
                    <th className="px-4 py-3">Visit ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Summary / Diagnosis</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {scans.map((scan, index) => {
                    const isCurrent = String(scan.id) === String(currentScanId)
                    const dateFormatted = scan.scan_date
                      ? new Date(scan.scan_date).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'
                    const summary =
                      scan.conclusion ||
                      scan.diagnosis ||
                      scan.findings?.slice(0, 70) ||
                      'Standard examination completed'

                    return (
                      <tr
                        key={scan.id || index}
                        className={`transition hover:bg-slate-50 ${
                          isCurrent ? 'bg-teal-50/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-600">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{dateFormatted}</div>
                          <div className="text-[11px] text-slate-400">ID: #{scan.id}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border ${getScanBadgeClass(
                              scan.scan_type
                            )}`}
                          >
                            {scan.scan_type || 'Echo Report'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {scan.visit_id ? `#${scan.visit_id}` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(scan.status)}</td>
                        <td className="px-4 py-3 text-xs text-slate-700 max-w-xs truncate" title={summary}>
                          {summary}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-teal-100 px-3 py-1.5 text-xs font-bold text-teal-800 border border-teal-300">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Current
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenScan(scan)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-700 transition"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open Report
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate(`/echo-studies?patient=${patientId}`)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            View all studies for this patient
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
