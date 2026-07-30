import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Baby,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  Heart,
  MoreHorizontal,
  Search,
  Smile,
  TrendingUp,
  Users,
} from 'lucide-react'
import { scanService } from '../api/scanService'
import { patientService } from '../api/patientService'

const scanRoutes = {
  'Adult Echo': '/adult-echo-report',
  'Fetal Echo': '/fetal-echo-report',
  'Pediatric Echo': '/pediatric-echo-report',
}

const asList = (result) => {
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result?.patients)) return result.patients
  if (Array.isArray(result?.scans)) return result.scans
  return []
}

const normalizeLookupId = (value) => String(value ?? '').trim()

const addPatientLookup = (map, key, patient) => {
  const normalized = normalizeLookupId(key)
  if (normalized) map.set(normalized, patient)
}

const buildPatientLookup = (patients) => {
  const map = new Map()

  patients.forEach((patient) => {
    addPatientLookup(map, patient.id, patient)
    addPatientLookup(map, patient.patient_id, patient)

    const numericFromDisplayId = String(patient.patient_id || '').match(/\d+$/)?.[0]
    if (numericFromDisplayId) {
      addPatientLookup(map, Number(numericFromDisplayId), patient)
      addPatientLookup(map, numericFromDisplayId, patient)
    }
  })

  return map
}

const findPatientForScan = (scan, patientLookup) => (
  patientLookup.get(normalizeLookupId(scan.patient_id)) ||
  patientLookup.get(normalizeLookupId(scan.patient_display_id)) ||
  patientLookup.get(normalizeLookupId(scan.patientDisplayId)) ||
  null
)

const formatPatientName = (patient) => {
  if (!patient) return 'Unknown patient'
  return [patient.salutation, patient.first_name, patient.middle_name, patient.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || patient.patient_id || 'Unknown patient'
}

const formatDemographics = (patient) => {
  if (!patient) return '—'
  const age = patient.age ?? ''
  const gender = String(patient.gender || '').trim().charAt(0).toUpperCase()
  return `${age}${gender}` || '—'
}

const formatScanDate = (value) => {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return { dateTime: 'Date not recorded', timeStr: '—' }
  return {
    dateTime: date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeStr: date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
  }
}

const getClinicalImportance = (scan) => {
  if (scan.abnormal) return 'High'
  if (scan.ambiguity || scan.growthAbnormality || scan.normalVariant) return 'Medium'
  return 'Low'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total_patients: 100,
    total_scans: 136,
    adult_echo: 81,
    fetal_echo: 25,
    pediatric_echo: 30,
    todays_visits: 0,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScanType, setSelectedScanType] = useState('All')
  const [recentScans, setRecentScans] = useState([])
  const [isLoadingScans, setIsLoadingScans] = useState(true)

  useEffect(() => {
    Promise.all([
      scanService.getDashboardStats(),
      scanService.getScans(),
      patientService.getPatients(),
    ])
      .then(([statsResult, scansResult, patientsResult]) => {
        if (statsResult.success && statsResult.data) {
          setStats((prev) => ({
            ...prev,
            total_patients: statsResult.data.total_patients ?? prev.total_patients,
            total_scans: statsResult.data.total_scans ?? prev.total_scans,
            adult_echo: statsResult.data.adult_echo ?? prev.adult_echo,
            fetal_echo: statsResult.data.fetal_echo ?? prev.fetal_echo,
            pediatric_echo: statsResult.data.pediatric_echo ?? prev.pediatric_echo,
          }))
        }

        const patients = asList(patientsResult)
        const patientLookup = buildPatientLookup(patients)
        const scans = [...asList(scansResult)]
          .sort((left, right) => {
            const rightDate = new Date(right.scan_date || right.created_at || 0).getTime()
            const leftDate = new Date(left.scan_date || left.created_at || 0).getTime()
            return (rightDate - leftDate) || (right.id - left.id)
          })
          .slice(0, 10)
          .map((scan) => {
            const patient = findPatientForScan(scan, patientLookup)
            const { dateTime, timeStr } = formatScanDate(scan.scan_date || scan.created_at)
            const patientName = formatPatientName(patient)
            const initials = [patient?.first_name, patient?.last_name]
              .filter(Boolean)
              .map((part) => part.charAt(0).toUpperCase())
              .join('')
              .slice(0, 2) || '—'

            return {
              id: scan.id,
              patientId: patient?.id || scan.patient_id || scan.patient_display_id,
              visitId: scan.visit_id,
              patientName,
              patientCode: patient?.patient_id || scan.patient_display_id || `Patient ${scan.patient_id}`,
              demographics: formatDemographics(patient),
              initials,
              scanType: scan.scan_type || 'Echo',
              scanRoute: scanRoutes[scan.scan_type] || '/echo-studies',
              dateTime,
              timeStr,
              aiSummary: scan.conclusion || scan.findings || 'No findings recorded.',
              importance: getClinicalImportance(scan),
              confidence: scan.ai_confidence ?? null,
            }
          })

        setRecentScans(scans)
      })
      .catch(() => setRecentScans([]))
      .finally(() => setIsLoadingScans(false))
  }, [])

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.total_patients,
      change: '+12 this week',
      isPositive: true,
      icon: Users,
      bgColor: 'bg-blue-500',
      strokeColor: '#3b82f6',
      path: 'M0,22 Q15,28 30,18 T60,20 T90,12 T120,6',
    },
    {
      title: 'Total Scans',
      value: stats.total_scans,
      change: '+18 this week',
      isPositive: true,
      icon: Activity,
      bgColor: 'bg-emerald-500',
      strokeColor: '#10b981',
      path: 'M0,24 Q15,20 30,22 T60,14 T90,16 T120,5',
    },
    {
      title: 'Adult Echo',
      value: stats.adult_echo,
      change: '+9 this week',
      isPositive: true,
      icon: Heart,
      bgColor: 'bg-purple-600',
      strokeColor: '#8b5cf6',
      path: 'M0,20 Q15,24 30,16 T60,22 T90,10 T120,7',
    },
    {
      title: 'Fetal Echo',
      value: stats.fetal_echo,
      change: '+4 this week',
      isPositive: true,
      icon: Baby,
      bgColor: 'bg-pink-500',
      strokeColor: '#ec4899',
      path: 'M0,26 Q15,22 30,24 T60,16 T90,20 T120,8',
    },
    {
      title: 'Pediatric Echo',
      value: stats.pediatric_echo,
      change: '+6 this week',
      isPositive: true,
      icon: Smile,
      bgColor: 'bg-orange-500',
      strokeColor: '#f97316',
      path: 'M0,24 Q15,26 30,20 T60,22 T90,14 T120,6',
    },
    {
      title: "Today's Visits",
      value: stats.todays_visits,
      change: 'No change',
      isPositive: false,
      icon: Calendar,
      bgColor: 'bg-blue-600',
      strokeColor: '#3b82f6',
      path: 'M0,16 L120,16',
    },
  ]

  const filteredScans = recentScans.filter((scan) => {
    const matchesSearch =
      !searchQuery ||
      scan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.aiSummary.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedScanType === 'All' || scan.scanType === selectedScanType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* 6 Stat Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${card.bgColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{card.title}</p>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {card.isPositive ? (
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <TrendingUp className="h-3 w-3" />
                      {card.change}
                    </span>
                  ) : (
                    <span className="font-medium text-slate-400">{card.change}</span>
                  )}
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div className="w-24 h-12 flex items-center justify-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30">
                  <path
                    d={card.path}
                    fill="none"
                    stroke={card.strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {/* Top 10 Recent Scans Main Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Section Header & Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Top 10 Recent Scans</h3>
            <p className="text-xs text-slate-500">Latest echo scans with AI analysis and clinical importance</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by patient, ID, or ref no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1">
              {['All', 'Adult Echo', 'Fetal Echo', 'Pediatric Echo'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedScanType(type)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    selectedScanType === type
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Date Range Button */}
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Latest database records</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Export Button */}
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Scan Type</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">AI Findings (Summary)</th>
                <th className="py-3 px-4">Clinical Importance</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredScans.map((scan, idx) => (
                <tr
                  key={scan.id}
                  onClick={() => navigate(`${scan.scanRoute}/${scan.id}?patientId=${scan.patientId}&visitId=${scan.visitId || ''}&scatter=true`)}
                  className="group cursor-pointer transition hover:bg-teal-50/30"
                >
                  {/* Row # */}
                  <td className="py-3.5 px-4 text-slate-400 font-medium">{idx + 1}</td>

                  {/* Patient Info */}
                  <td
                    className="py-3.5 px-4"
                    onClick={(event) => {
                      event.stopPropagation()
                      if (scan.patientId) navigate(`/visits?patient=${scan.patientId}`)
                    }}
                  >
                    <div className="flex items-center gap-3" title="Open patient visits">
                      <div
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-blue-100 text-xs font-bold text-teal-800 ring-2 ring-slate-100"
                      >
                        {scan.initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                          {scan.patientName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {scan.patientCode} · {scan.demographics}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Scan Type Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        scan.scanType === 'Adult Echo'
                          ? 'bg-purple-100 text-purple-700'
                          : scan.scanType === 'Fetal Echo'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {scan.scanType}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{scan.dateTime}</p>
                    <p className="text-[11px] text-slate-400">{scan.timeStr}</p>
                  </td>

                  {/* AI Findings Summary */}
                  <td className="py-3.5 px-4 max-w-xs font-medium text-slate-700">
                    {scan.aiSummary}
                  </td>

                  {/* Clinical Importance Pill */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold border ${
                        scan.importance === 'High'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : scan.importance === 'Medium'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}
                    >
                      {scan.importance}
                    </span>
                  </td>

                  {/* AI Confidence Bar */}
                  <td className="py-3.5 px-4 w-36">
                    {scan.confidence == null ? (
                      <span className="text-slate-400">Not recorded</span>
                    ) : (
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800">{scan.confidence}%</span>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${scan.confidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Action Icon Buttons */}
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`${scan.scanRoute}/${scan.id}?patientId=${scan.patientId}&visitId=${scan.visitId || ''}&scatter=true`)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-700 transition"
                        title="View Report"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`${scan.scanRoute}/${scan.id}?patientId=${scan.patientId}&visitId=${scan.visitId || ''}&scatter=true`)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-700 transition"
                        title="View Document"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoadingScans && filteredScans.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-sm text-slate-500">
                    No scans match the selected filters.
                  </td>
                </tr>
              )}
              {isLoadingScans && (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading patient and scan records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredScans.length ? 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-800">{filteredScans.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{stats.total_scans}</span> scans
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                    page === 1
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-1 text-slate-400">...</span>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                14
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <select className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700">
              <option>10 / page</option>
              <option>25 / page</option>
              <option>50 / page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
