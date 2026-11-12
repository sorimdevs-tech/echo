import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Eye,
  Printer,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

export default function Reports() {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScanType, setSelectedScanType] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    Promise.all([patientService.getPatients(), scanService.getScans()])
      .then(([p, s]) => {
        setPatients(p.data || [])
        setScans(s.data || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedScanType, selectedStatus])

  const patientMap = useMemo(() => {
    const map = new Map()
    patients.forEach((p) => map.set(p.id, p))
    return map
  }, [patients])

  const filteredReports = useMemo(() => {
    return scans.filter((scan) => {
      const p = patientMap.get(scan.patient_id) || {}
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
      const pid = String(p.patient_id || '').toLowerCase()
      const query = searchQuery.toLowerCase()
      const matchesSearch = !query || name.includes(query) || pid.includes(query)
      const matchesType = selectedScanType === 'All' || scan.scan_type === selectedScanType
      const matchesStatus = selectedStatus === 'All' || String(scan.status || '').toLowerCase() === selectedStatus.toLowerCase()
      return matchesSearch && matchesType && matchesStatus
    })
  }, [scans, patientMap, searchQuery, selectedScanType, selectedStatus])

  const totalItems = filteredReports.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedReports = useMemo(() => {
    return filteredReports.slice(startIndex, endIndex)
  }, [filteredReports, startIndex, endIndex])

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages]
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  const openReport = (scan) => {
    const route = scan.scan_type === 'Fetal Echo'
      ? '/fetal-echo-report'
      : scan.scan_type === 'Pediatric Echo'
      ? '/pediatric-echo-report'
      : '/adult-echo-report'
    
    navigate(`${route}/${scan.id}?patientId=${scan.patient_id}&visitId=${scan.visit_id || ''}&scatter=true`)
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header card */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" /> Clinical Reports Hub
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Echocardiography Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Access, draft, review, and print Adult, Pediatric, and Fetal Echo reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/fetal-echo-report')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" /> New Fetal Echo Report
          </button>
          <button
            type="button"
            onClick={() => navigate('/pediatric-echo-report')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> New Pediatric Echo Report
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            placeholder="Search report by Patient Name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
            value={selectedScanType}
            onChange={(e) => setSelectedScanType(e.target.value)}
          >
            <option value="All">All Study Types</option>
            <option value="Fetal Echo">Fetal Echo</option>
            <option value="Pediatric Echo">Pediatric Echo</option>
            <option value="Adult Echo">Adult Echo</option>
          </select>

          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Draft">Draft</option>
            <option value="In progress">In progress</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Report Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Impression Summary</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedReports.map((report) => {
                const p = patientMap.get(report.patient_id) || {}
                const name = `${p.salutation || ''} ${p.first_name || ''} ${p.last_name || ''}`.trim() || p.patient_id || 'Unknown'
                const isComplete = String(report.status || '').toLowerCase() === 'completed'
                const dateStr = report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'

                return (
                  <tr key={report.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => openReport(report)}>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div>{name}</div>
                      <div className="text-xs text-slate-500">{p.patient_id || report.patient_display_id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border ${
                        report.scan_type === 'Fetal Echo'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : report.scan_type === 'Pediatric Echo'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {report.scan_type || 'Echo Report'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        isComplete
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {report.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 max-w-xs truncate">
                      {report.diagnosis || report.impression || 'NORMAL SCAN AND SEGMENTAL ANATOMY.'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{dateStr}</td>
                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReport(report)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => openReport(report)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!loading && filteredReports.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                    No clinical reports match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div>
              Showing <span className="font-bold text-slate-900">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-900">{totalItems}</span> reports
            </div>
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <span className="text-slate-500">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="First Page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-8 items-center gap-1 px-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {getPageNumbers().map((pNum, idx) => {
                if (pNum === '...') {
                  return (
                    <span key={`ell-${idx}`} className="flex h-8 w-7 items-center justify-center text-slate-400 font-bold select-none">
                      …
                    </span>
                  )
                }
                const isActive = pNum === currentPage
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setCurrentPage(pNum)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg text-xs font-bold transition px-2 ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pNum}
                  </button>
                )
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 items-center gap-1 px-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Last Page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
