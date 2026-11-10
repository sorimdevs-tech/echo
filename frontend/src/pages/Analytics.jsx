import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Download,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Filter,
  User,
  Calendar,
} from 'lucide-react'
import { FieldGrid, Section, Tabs, Workspace } from '../components/WorkspaceUI'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'
import { workspaceService } from '../api/workspaceService'

const f = (key, label, type = 'text', options, addable = false) => ({
  key,
  label,
  type,
  options,
  addable,
})

const initial = {
  from: '',
  to: '',
  sex: '',
  patientId: '',
  firstName: '',
  lastName: '',
  ageFrom: '',
  ageTo: '',
  ethnicOrigin: '',
  scanType: '',
  status: '',
  indication: '',
  diagnosis: '',
  referralDoctor: '',
  primaryConsultant: '',
  signedByLeft: '',
  signedByRight: '',
  typedBy: '',
  reviewedBy: '',
  icdCode: '',
  abnormal: false,
  ambiguity: false,
  growthAbnormality: false,
  normal: false,
  normalVariant: false,
}

const columnNames = [
  'Patient ID',
  'Name',
  'Gender',
  'Date of birth',
  'Address',
  'Visit date',
  'Visit no',
  'Referral doctor',
  'Age',
  'Alias ID',
  'Scan type',
  'Status',
  'Diagnosis',
  'Consultant',
]

export default function Analytics() {
  const [tab, setTab] = useState('Advanced query')
  const [patients, setPatients] = useState([])
  const [scans, setScans] = useState([])
  const [saved, setSaved] = useState([])
  const [query, setQuery] = useState(initial)
  const [columns, setColumns] = useState(columnNames)

  useEffect(() => {
    Promise.all([
      patientService.getPatients(),
      scanService.getScans(),
      workspaceService.list('saved-queries'),
    ]).then(([p, s, q]) => {
      setPatients(p.data || [])
      setScans(s.data || [])
      setSaved(q.data || [])
    })
  }, [])

  const rows = useMemo(
    () =>
      scans
        .map((scan) => {
          const patient = patients.find((p) =>
            [p.id, p.patient_id].includes(scan.patient_id),
          )
          return { ...scan, patient }
        })
        .filter((row) => {
          const patient = row.patient || {}
          const created = row.created_at ? new Date(row.created_at) : null
          const from = query.from ? new Date(query.from) : null
          const to = query.to ? new Date(`${query.to}T23:59:59`) : null
          const blob = JSON.stringify(row).toLowerCase()

          return (
            (!from || created >= from) &&
            (!to || created <= to) &&
            (!query.patientId ||
              String(patient.patient_id || '')
                .toLowerCase()
                .includes(query.patientId.toLowerCase())) &&
            (!query.firstName ||
              String(patient.first_name || '')
                .toLowerCase()
                .includes(query.firstName.toLowerCase())) &&
            (!query.lastName ||
              String(patient.last_name || '')
                .toLowerCase()
                .includes(query.lastName.toLowerCase())) &&
            (!query.sex || patient.gender === query.sex) &&
            (!query.ageFrom || Number(patient.age) >= Number(query.ageFrom)) &&
            (!query.ageTo || Number(patient.age) <= Number(query.ageTo)) &&
            (!query.ethnicOrigin ||
              String(patient.ethnic_origin || '')
                .toLowerCase()
                .includes(query.ethnicOrigin.toLowerCase())) &&
            (!query.scanType || row.scan_type === query.scanType) &&
            (!query.status ||
              String(row.status || '')
                .toLowerCase()
                .includes(query.status.toLowerCase())) &&
            (!query.indication || blob.includes(query.indication.toLowerCase())) &&
            (!query.diagnosis || blob.includes(query.diagnosis.toLowerCase())) &&
            (!query.referralDoctor ||
              blob.includes(query.referralDoctor.toLowerCase())) &&
            (!query.primaryConsultant ||
              blob.includes(query.primaryConsultant.toLowerCase())) &&
            (!query.signedByLeft ||
              blob.includes(query.signedByLeft.toLowerCase())) &&
            (!query.signedByRight ||
              blob.includes(query.signedByRight.toLowerCase())) &&
            (!query.typedBy || blob.includes(query.typedBy.toLowerCase())) &&
            (!query.reviewedBy ||
              blob.includes(query.reviewedBy.toLowerCase())) &&
            (!query.icdCode || blob.includes(query.icdCode.toLowerCase())) &&
            (!query.abnormal || row.abnormal) &&
            (!query.ambiguity || row.ambiguity) &&
            (!query.growthAbnormality || row.growthAbnormality) &&
            (!query.normal || row.normal) &&
            (!query.normalVariant || row.normalVariant)
          )
        }),
    [patients, scans, query],
  )

  const stats = useMemo(
    () =>
      ['Adult Echo', 'Pediatric Echo', 'Fetal Echo'].map((type) => ({
        type,
        count: rows.filter((row) => row.scan_type === type).length,
        completed: rows.filter(
          (row) =>
            row.scan_type === type &&
            String(row.status).toLowerCase() === 'completed',
        ).length,
      })),
    [rows],
  )

  const exportCsv = (rowsToExport = rows) => {
    const headers = columns
    const values = (row) =>
      columns
        .map((column) => {
          const p = row.patient || {}
          const map = {
            'Patient ID': p.patient_id,
            Name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
            Gender: p.gender,
            'Date of birth': p.dob,
            Address: [p.street, p.area, p.district_city]
              .filter(Boolean)
              .join(' '),
            'Visit date': row.visit_date || row.created_at,
            'Visit no': row.visit_id,
            'Referral doctor': row.referral_doctor,
            Age: p.age,
            'Alias ID': p.alias_id,
            'Scan type': row.scan_type,
            Status: row.status,
            Diagnosis: row.diagnosis || row.impression,
            Consultant: row.primaryConsultant,
          }
          return `"${String(map[column] || '').replaceAll('"', '""')}"`
        })
        .join(',')

    const content = [headers.join(','), ...rowsToExport.map(values)].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }))
    a.download = `echo-query-results-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const genderStats = useMemo(() => {
    const male = rows.filter(
      (r) =>
        r.patient?.gender === 'M' ||
        String(r.patient?.gender).toLowerCase() === 'male',
    ).length
    const female = rows.filter(
      (r) =>
        r.patient?.gender === 'F' ||
        String(r.patient?.gender).toLowerCase() === 'female',
    ).length
    const other = Math.max(0, rows.length - male - female)
    return [
      {
        label: 'Male',
        count: male,
        percent: rows.length ? ((male / rows.length) * 100).toFixed(1) : '0',
        color: 'bg-blue-600',
        textColor: 'text-blue-700',
      },
      {
        label: 'Female',
        count: female,
        percent: rows.length ? ((female / rows.length) * 100).toFixed(1) : '0',
        color: 'bg-rose-500',
        textColor: 'text-rose-700',
      },
      {
        label: 'Unspecified / Other',
        count: other,
        percent: rows.length ? ((other / rows.length) * 100).toFixed(1) : '0',
        color: 'bg-slate-400',
        textColor: 'text-slate-700',
      },
    ]
  }, [rows])

  return (
    <Workspace
      title="Queries & analytics"
      description="Advanced clinical queries, reusable search definitions, printable columns and scan statistics."
      actions={
        <button className="secondary-button" onClick={() => exportCsv()}>
          <Download className="h-4 w-4" />
          Export selected columns
        </button>
      }
    >
      <Tabs
        items={['Advanced query', 'Saved queries', 'Statistics']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Advanced query' && (
        <>
          <Section title="Sonocare query criteria">
            <FieldGrid
              fields={[
                f('from', 'From date', 'date'),
                f('to', 'To date', 'date'),
                f('sex', 'Sex', 'select', ['Male', 'Female', 'Unknown']),
                f('patientId', 'Patient ID'),
                f('firstName', 'First name'),
                f('lastName', 'Last name'),
                f('ageFrom', 'Age from', 'number'),
                f('ageTo', 'Age to', 'number'),
                f('ethnicOrigin', 'Ethnic origin', 'select', [], true),
                f(
                  'scanType',
                  'Scan type',
                  'select',
                  ['Adult Echo', 'Pediatric Echo', 'Fetal Echo', 'Template report'],
                ),
                f(
                  'status',
                  'Investigation status',
                  'select',
                  ['Draft', 'In progress', 'Completed'],
                ),
                f('indication', 'Indication'),
                f('diagnosis', 'Diagnosis / final impression'),
                f('referralDoctor', 'Referral doctor'),
                f('primaryConsultant', 'Primary consultant'),
                f('signedByLeft', 'Signed by (L)'),
                f('signedByRight', 'Signed by (R)'),
                f('typedBy', 'Typed by'),
                f('reviewedBy', 'Reviewed by'),
                f('icdCode', 'Provisional / final ICD code'),
              ]}
              data={query}
              setData={setQuery}
            />

            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {[
                ['abnormal', 'Abnormal'],
                ['ambiguity', 'Ambiguity'],
                ['growthAbnormality', 'Growth abnormality'],
                ['normal', 'Normal'],
                ['normalVariant', 'Normal variant'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={query[key]}
                    onChange={(e) =>
                      setQuery({ ...query, [key]: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#0f5449] focus:ring-[#0f5449]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button className="primary-button">
                <Search className="h-4 w-4" />
                Search
              </button>
              <button
                className="secondary-button"
                onClick={() => setQuery(initial)}
              >
                Clear
              </button>
            </div>
          </Section>

          <Section title="Select columns to print" className="mt-4">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {columnNames.map((column) => (
                <label
                  key={column}
                  className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={columns.includes(column)}
                    onChange={() =>
                      setColumns(
                        columns.includes(column)
                          ? columns.filter((item) => item !== column)
                          : [...columns, column],
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#0f5449] focus:ring-[#0f5449]"
                  />
                  <span>{column}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* New Modern Paginated Query Results Table */}
          <Results rows={rows} onExport={exportCsv} />
        </>
      )}

      {tab === 'Saved queries' && (
        <SavedQueries
          saved={saved}
          setSaved={setSaved}
          query={query}
          setQuery={setQuery}
          setTab={setTab}
        />
      )}

      {tab === 'Statistics' && (
        <>
          <Section title="Statistics filters">
            <FieldGrid
              fields={[
                f('from', 'From date', 'date'),
                f('to', 'To date', 'date'),
                f('sex', 'Sex', 'select', ['Male', 'Female', 'Unknown']),
                f('icdCode', 'Provisional / final ICD code'),
              ]}
              data={query}
              setData={setQuery}
            />
          </Section>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.type}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {item.type}
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
                  {item.count}
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  {item.completed} completed
                </p>
              </div>
            ))}
          </div>

          <Section title="Gender Distribution Data" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {genderStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </span>
                    <span className={`text-xs font-bold ${item.textColor}`}>
                      {item.percent}%
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
                    {item.count}
                  </p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </Workspace>
  )
}

function getInitials(first, last) {
  const f = (first || '').trim()[0] || ''
  const l = (last || '').trim()[0] || ''
  if (!f && !l) return 'PT'
  return (f + l).toUpperCase()
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return { date: '—', time: '' }
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return { date: String(dateStr), time: '' }
    const date = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    return { date, time }
  } catch (e) {
    return { date: String(dateStr), time: '' }
  }
}

function Results({ rows, onExport }) {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [jumpPage, setJumpPage] = useState('')

  // Filter rows based on quick search input
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows
    const term = searchTerm.trim().toLowerCase()
    return rows.filter((row) => {
      const p = row.patient || {}
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
      const patientId = String(p.patient_id || '').toLowerCase()
      const scanType = String(row.scan_type || '').toLowerCase()
      const status = String(row.status || '').toLowerCase()
      const diagnosis = String(row.diagnosis || row.impression || '').toLowerCase()
      return (
        fullName.includes(term) ||
        patientId.includes(term) ||
        scanType.includes(term) ||
        status.includes(term) ||
        diagnosis.includes(term)
      )
    })
  }, [rows, searchTerm])

  // Sort filtered rows
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (sortField === 'patient') {
        valA = `${a.patient?.first_name || ''} ${a.patient?.last_name || ''}`.toLowerCase()
        valB = `${b.patient?.first_name || ''} ${b.patient?.last_name || ''}`.toLowerCase()
      } else if (sortField === 'created_at') {
        valA = new Date(a.created_at || a.visit_date || 0).getTime()
        valB = new Date(b.created_at || b.visit_date || 0).getTime()
      } else {
        valA = String(valA || '').toLowerCase()
        valB = String(valB || '').toLowerCase()
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [filteredRows, sortField, sortAsc])

  // Pagination bounds
  const totalItems = sortedRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Reset to page 1 if search or pageSize changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  // Ensure currentPage is within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const currentRows = sortedRows.slice(startIndex, endIndex)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition" />
    }
    return sortAsc ? (
      <ArrowUp className="h-3 w-3 text-[#0f5449]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#0f5449]" />
    )
  }

  const handleJumpSubmit = (e) => {
    e.preventDefault()
    const pageNum = parseInt(jumpPage, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      setJumpPage('')
    }
  }

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  const getScanReportRoute = (row) => {
    if (row.scan_type === 'Fetal Echo') return `/fetal-echo-report/${row.id}`
    if (row.scan_type === 'Pediatric Echo') return `/pediatric-echo-report/${row.id}`
    return `/adult-echo-report/${row.id}`
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Card Header & Toolbar */}
      <div className="border-b border-slate-200/80 p-4 sm:p-5 bg-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Title & Count */}
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Query Results
              </h3>
              <span className="inline-flex items-center rounded-full bg-[#e6f4f1] px-2.5 py-0.5 text-xs font-bold text-[#0f5449]">
                {totalItems} {totalItems === 1 ? 'Scan' : 'Scans'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {totalItems > 0
                ? `Showing records ${startIndex + 1} to ${endIndex} of ${totalItems}`
                : 'No records matching current criteria'}
            </p>
          </div>

          {/* Quick Search, Page Size & Export Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Instant Filter Search Input */}
            <div className="relative min-w-[220px] sm:min-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter results..."
                className="h-9 w-full rounded-xl border border-slate-200/90 bg-slate-50/60 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#0f5449] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f5449]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="hidden sm:inline">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-9 rounded-xl border border-slate-200/90 bg-slate-50/60 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100/70 focus:border-[#0f5449] focus:outline-none cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              type="button"
              onClick={() => onExport?.(sortedRows)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              title="Export filtered records to CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-bold uppercase tracking-wider text-[11px] select-none">
              <th className="py-3 px-4 w-12 text-slate-400">#</th>

              <th
                onClick={() => handleSort('patient')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition group"
              >
                <div className="flex items-center gap-1.5">
                  <span>PATIENT DETAILS</span>
                  {getSortIcon('patient')}
                </div>
              </th>

              <th
                onClick={() => handleSort('scan_type')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition group"
              >
                <div className="flex items-center gap-1.5">
                  <span>SCAN TYPE</span>
                  {getSortIcon('scan_type')}
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition group"
              >
                <div className="flex items-center gap-1.5">
                  <span>STATUS</span>
                  {getSortIcon('status')}
                </div>
              </th>

              <th className="py-3 px-4">CLINICAL INDICATOR</th>

              <th
                onClick={() => handleSort('diagnosis')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition group"
              >
                <div className="flex items-center gap-1.5">
                  <span>DIAGNOSIS / IMPRESSION</span>
                  {getSortIcon('diagnosis')}
                </div>
              </th>

              <th
                onClick={() => handleSort('created_at')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition group whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>DATE & TIME</span>
                  {getSortIcon('created_at')}
                </div>
              </th>

              <th className="py-3 px-4 text-center">ACTIONS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                      <Search className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No matching query results</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {searchTerm
                        ? `No records found matching "${searchTerm}". Try adjusting your search keyword.`
                        : 'No scans match the current query criteria.'}
                    </p>
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="mt-3 text-xs font-semibold text-[#0f5449] hover:underline"
                      >
                        Clear search filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              currentRows.map((row, idx) => {
                const patient = row.patient || {}
                const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
                const initials = getInitials(patient.first_name, patient.last_name)
                const dateInfo = formatDateDisplay(row.created_at || row.visit_date)
                const statusStr = String(row.status || '').toLowerCase()

                return (
                  <tr
                    key={row.id || idx}
                    className="group transition-colors duration-150 hover:bg-[#f8fbfa] cursor-pointer"
                    onClick={() => navigate(getScanReportRoute(row))}
                  >
                    {/* Index */}
                    <td className="py-3.5 px-4 text-slate-400 font-semibold text-[11px]">
                      {startIndex + idx + 1}
                    </td>

                    {/* Patient Details */}
                    <td
                      className="py-3.5 px-4"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (patient.id) navigate(`/visits?patient=${patient.id}`)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1e3a8a] text-xs font-bold text-white shadow-2xs group-hover:scale-105 transition-transform"
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-[#0f5449] transition text-xs">
                            {patientName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                              {patient.patient_id || 'ID Pending'}
                            </span>
                            {(patient.age || patient.gender) && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                · {[patient.age ? `${patient.age}y` : '', patient.gender].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Scan Type Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          row.scan_type === 'Adult Echo'
                            ? 'bg-purple-100/80 text-purple-700 border border-purple-200/60'
                            : row.scan_type === 'Fetal Echo'
                            ? 'bg-pink-100/80 text-pink-700 border border-pink-200/60'
                            : row.scan_type === 'Pediatric Echo'
                            ? 'bg-orange-100/80 text-orange-700 border border-orange-200/60'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                        }`}
                      >
                        {row.scan_type || 'Echo Scan'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          statusStr === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : statusStr.includes('progress')
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                            : 'bg-slate-100 text-slate-600 border-slate-200/80'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            statusStr === 'completed'
                              ? 'bg-emerald-500'
                              : statusStr.includes('progress')
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-slate-400'
                          }`}
                        />
                        {row.status || 'Draft'}
                      </span>
                    </td>

                    {/* Clinical Indicator */}
                    <td className="py-3.5 px-4">
                      {row.abnormal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200/80 px-2.5 py-0.5 text-[11px] font-bold">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Abnormal</span>
                        </span>
                      ) : row.ambiguity ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold">
                          Ambiguity
                        </span>
                      ) : row.growthAbnormality ? (
                        <span className="inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-[11px] font-semibold">
                          Growth Abnormality
                        </span>
                      ) : row.normal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Normal</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">—</span>
                      )}
                    </td>

                    {/* Diagnosis / Impression */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p
                        className="truncate text-xs text-slate-700 font-medium"
                        title={row.diagnosis || row.impression || row.indication || 'No diagnosis recorded'}
                      >
                        {row.diagnosis || row.impression || row.indication || '—'}
                      </p>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{dateInfo.date}</p>
                      {dateInfo.time && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{dateInfo.time}</p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(getScanReportRoute(row))
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-[#0f5449] hover:bg-emerald-50 transition"
                          title="Open Echo Report"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (patient.id) navigate(`/visits?patient=${patient.id}`)
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View Patient Visits & History"
                        >
                          <User className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      <div className="border-t border-slate-200/80 bg-slate-50/50 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Summary text */}
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-800">{endIndex}</span> of{' '}
            <span className="font-bold text-slate-800">{totalItems}</span> results
          </div>

          {/* Page numbers and navigation buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* First Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 items-center gap-1 px-2.5 rounded-lg border border-slate-200/80 bg-white text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Numbered Page Buttons */}
            {getPageNumbers().map((pageItem, index) => {
              if (pageItem === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-8 w-8 items-center justify-center text-xs font-bold text-slate-400 select-none"
                  >
                    …
                  </span>
                )
              }

              const isCurrent = pageItem === currentPage
              return (
                <button
                  key={`page-${pageItem}`}
                  type="button"
                  onClick={() => setCurrentPage(pageItem)}
                  className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-lg text-xs font-bold transition shadow-2xs ${
                    isCurrent
                      ? 'bg-[#0f5449] text-white shadow-xs'
                      : 'border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageItem}
                </button>
              )
            })}

            {/* Next Page */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex h-8 items-center gap-1 px-2.5 rounded-lg border border-slate-200/80 bg-white text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>

            {/* Jump to page form */}
            {totalPages > 5 && (
              <form onSubmit={handleJumpSubmit} className="hidden lg:flex items-center gap-1 ml-2">
                <span className="text-xs text-slate-400 font-medium">Go to:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  placeholder={String(currentPage)}
                  className="h-8 w-12 rounded-lg border border-slate-200 bg-white px-1.5 text-center text-xs font-semibold text-slate-800 focus:border-[#0f5449] focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-8 rounded-lg border border-slate-200/80 bg-white px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                >
                  Go
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SavedQueries({ saved, setSaved, query, setQuery, setTab }) {
  const [name, setName] = useState('')

  const add = async () => {
    if (!name.trim()) return
    const result = await workspaceService.create('saved-queries', {
      name: name.trim(),
      query,
    })
    setSaved([...saved, result.data])
    setName('')
  }

  const remove = async (item) => {
    await workspaceService.remove('saved-queries', item.id)
    setSaved(saved.filter((entry) => entry.id !== item.id))
  }

  return (
    <Section title="Saved queries">
      <div className="mb-4 flex gap-2">
        <input
          className="field-control max-w-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Save as query name"
        />
        <button className="primary-button" onClick={add}>
          <Plus className="h-4 w-4" />
          Save query
        </button>
      </div>

      <div className="space-y-2">
        {saved.map((item) => (
          <div
            key={item.id}
            className="flex items-center rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs"
          >
            <button
              onClick={() => {
                setQuery({ ...initial, ...item.query })
                setTab('Advanced query')
              }}
              className="flex-1 text-left font-semibold text-slate-800 hover:text-[#0f5449] transition text-sm"
            >
              {item.name}
            </button>
            <button
              onClick={() => remove(item)}
              className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Delete saved query"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Section>
  )
}
