import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Baby,
  Calendar,
  CalendarCheck,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Heart,
  Search,
  Smile,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
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
  if (!date || Number.isNaN(date.getTime())) return { dateTime: 'Date not recorded', timeStr: '—', rawDate: null }
  return {
    dateTime: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeStr: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase(),
    rawDate: date,
  }
}

const getClinicalImportance = (scan) => {
  return scan.clinical_importance || 'Not recorded'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total_patients: 0,
    total_scans: 0,
    total_visits: 0,
    todays_visits: 0,
    upcoming_visits: 0,
    adult_echo: 0,
    fetal_echo: 0,
    pediatric_echo: 0,
    ultrasound: 0,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScanType, setSelectedScanType] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false)
  const [recentScans, setRecentScans] = useState([])
  const [isLoadingScans, setIsLoadingScans] = useState(true)
  const [loadError,setLoadError]=useState('')

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
            total_visits: statsResult.data.total_visits ?? prev.total_visits,
            todays_visits: statsResult.data.todays_visits ?? prev.todays_visits,
            upcoming_visits: statsResult.data.upcoming_visits ?? prev.upcoming_visits,
            adult_echo: statsResult.data.adult_echo ?? prev.adult_echo,
            fetal_echo: statsResult.data.fetal_echo ?? prev.fetal_echo,
            pediatric_echo: statsResult.data.pediatric_echo ?? prev.pediatric_echo,
            ultrasound: statsResult.data.ultrasound ?? 0,
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
          .map((scan) => {
            const patient = findPatientForScan(scan, patientLookup)
            const { dateTime, timeStr, rawDate } = formatScanDate(scan.scan_date || scan.created_at)
            const patientName = formatPatientName(patient)
            const initials = [patient?.first_name, patient?.last_name]
              .filter(Boolean)
              .map((part) => part.charAt(0).toUpperCase())
              .join('')
              .slice(0, 2) || 'AB'

            return {
              id: scan.id,
              patientId: patient?.id || scan.patient_id || scan.patient_display_id,
              visitId: scan.visit_id,
              patientName,
              patientCode: patient?.patient_id || scan.patient_display_id || `PAT${scan.patient_id}`,
              demographics: formatDemographics(patient),
              initials,
              scanType: scan.scan_type || 'Echo',
              scanRoute: scanRoutes[scan.scan_type] || '/echo-studies',
              dateTime,
              timeStr,
              rawDate,
              aiSummary: scan.conclusion || scan.findings || 'No findings recorded.',
              importance: getClinicalImportance(scan),
              confidence: scan.ai_confidence ?? null,
            }
          })

        setRecentScans(scans)
      })
      .catch(() => {setRecentScans([]);setLoadError('Unable to load dashboard data. Refresh to retry.')})
      .finally(() => setIsLoadingScans(false))
  }, [])

  // 8 Card Stat Section Config matching exact design mockup
  const statCards = [
    {
      title: 'TOTAL PATIENTS',
      value: stats.total_patients,
      change: '',
      isPositive: true,
      icon: Users,
      iconBg: 'bg-[#10b981]', // emerald green
      strokeColor: '#10b981',
      path: 'M0,22 Q15,28 30,18 T60,20 T90,12 T120,6',
      link: '/patients',
    },
    {
      title: 'TOTAL SCANS',
      value: stats.total_scans,
      change: '',
      isPositive: true,
      icon: Activity,
      iconBg: 'bg-[#3b82f6]', // blue
      strokeColor: '#3b82f6',
      path: 'M0,24 Q15,20 30,22 T60,14 T90,16 T120,5',
      link: '/echo-studies',
    },
    {
      title: 'TOTAL VISITS',
      value: stats.total_visits,
      change: '',
      isPositive: true,
      icon: CalendarCheck,
      iconBg: 'bg-[#8b5cf6]', // purple
      strokeColor: '#8b5cf6',
      path: 'M0,20 Q15,24 30,16 T60,22 T90,10 T120,8',
      link: '/visits',
    },
    {
      title: "TODAY'S VISITS",
      value: stats.todays_visits,
      change: '',
      isPositive: false,
      icon: Clock,
      iconBg: 'bg-[#f97316]', // orange
      strokeColor: '#f97316',
      path: 'M0,22 Q15,18 30,24 T60,16 T90,20 T120,12',
      link: '/visits',
    },
    {
      title: 'UPCOMING VISITS',
      value: stats.upcoming_visits,
      change: 'Scheduled',
      isPositive: false,
      isScheduled: true,
      icon: Calendar,
      iconBg: 'bg-[#0284c7]', // cyan/blue
      strokeColor: '#0284c7',
      link: '/visits',
    },
    {
      title: 'ADULT ECHO',
      value: stats.adult_echo,
      change: '',
      isPositive: true,
      icon: Heart,
      iconBg: 'bg-[#7c3aed]', // purple
      strokeColor: '#7c3aed',
      link: '/adult-echo-report',
    },
    {
      title: 'FETAL ECHO',
      value: stats.fetal_echo,
      change: '',
      isPositive: true,
      icon: Baby,
      iconBg: 'bg-[#ec4899]', // pink
      strokeColor: '#ec4899',
      link: '/fetal-echo-report',
    },
    {
      title: 'PEDIATRIC ECHO',
      value: stats.pediatric_echo,
      change: '',
      isPositive: true,
      icon: Smile,
      iconBg: 'bg-[#f97316]', // orange
      strokeColor: '#f97316',
      link: '/pediatric-echo-report',
    },
  ]


  statCards.push({ title:'ULTRASOUND', value:stats.ultrasound, change:'', isPositive:true, icon:Activity, iconBg:'bg-slate-600', strokeColor:'#475569', link:'/visits' })
  // Datewise Filtering Logic
  const dateFilteredScans = useMemo(() => {
    return recentScans.filter((scan) => {
      // 1. Scan Type Filter
      if (selectedScanType !== 'All' && scan.scanType !== selectedScanType) {
        return false
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = scan.patientName.toLowerCase().includes(q)
        const matchCode = scan.patientCode.toLowerCase().includes(q)
        const matchSummary = scan.aiSummary.toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchSummary) return false
      }

      // 3. Date Filter
      if (dateFilter === 'All') return true
      if (!scan.rawDate) return false

      const scanDate = scan.rawDate
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      if (dateFilter === 'Today') {
        const scanDay = new Date(scanDate.getFullYear(), scanDate.getMonth(), scanDate.getDate())
        return scanDay.getTime() === startOfToday.getTime()
      }

      if (dateFilter === 'Yesterday') {
        const yesterday = new Date(startOfToday)
        yesterday.setDate(yesterday.getDate() - 1)
        const scanDay = new Date(scanDate.getFullYear(), scanDate.getMonth(), scanDate.getDate())
        return scanDay.getTime() === yesterday.getTime()
      }

      if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date(startOfToday)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return scanDate >= sevenDaysAgo && scanDate <= now
      }

      if (dateFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date(startOfToday)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return scanDate >= thirtyDaysAgo && scanDate <= now
      }

      if (dateFilter === 'This Month') {
        return (
          scanDate.getMonth() === now.getMonth() &&
          scanDate.getFullYear() === now.getFullYear()
        )
      }

      if (dateFilter === 'Custom') {
        if (customStartDate) {
          const from = new Date(customStartDate)
          from.setHours(0, 0, 0, 0)
          if (scanDate < from) return false
        }
        if (customEndDate) {
          const to = new Date(customEndDate)
          to.setHours(23, 59, 59, 999)
          if (scanDate > to) return false
        }
        return true
      }

      return true
    })
  }, [recentScans, selectedScanType, searchQuery, dateFilter, customStartDate, customEndDate])

  // Limit to Top 10 Recent Scans
  const top10Scans = useMemo(() => dateFilteredScans.slice(0, 10), [dateFilteredScans])

  // Export Filtered Scans as CSV
  const handleExport = () => {
    const headers = ['#', 'Patient Name', 'Patient ID', 'Scan Type', 'Date', 'Time', 'AI Findings', 'Importance']
    const rows = top10Scans.map((s, idx) => [
      idx + 1,
      `"${s.patientName}"`,
      `"${s.patientCode}"`,
      `"${s.scanType}"`,
      `"${s.dateTime}"`,
      `"${s.timeStr}"`,
      `"${s.aiSummary.replace(/"/g, '""')}"`,
      `"${s.importance}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `recent_scans_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-5 select-none">
      {loadError && <p role="alert" className="rounded border bg-red-50 p-3 text-red-800">{loadError}</p>}
      {isLoadingScans && <p role="status">Loading dashboard…</p>}
      {/* 8 Stat Cards Grid (4 columns x 2 rows) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <button type="button"
              key={card.title}
              onClick={() => navigate(card.link)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${card.iconBg}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{card.title}</p>
                      <h3 className="text-[1.75rem] font-bold tracking-tight text-slate-900 leading-none mt-1">{loadError ? '—' : card.value}</h3>
                    </div>
                  </div>

                  <div className="pt-2 text-xs">
                    {card.isPositive ? (
                      <span className="font-semibold text-emerald-600">
                        {card.change}
                      </span>
                    ) : card.isScheduled ? (
                      <span className="font-semibold text-blue-500">
                        {card.change}
                      </span>
                    ) : (
                      <span className="font-medium text-slate-400">
                        {card.change}
                      </span>
                    )}
                  </div>
                </div>

                {card.path && (
                  <svg className="absolute right-4 top-1/2 h-8 w-20 -translate-y-1/2 opacity-80" viewBox="0 0 120 32" aria-hidden="true">
                    <path d={card.path} fill="none" stroke={card.strokeColor} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Top 10 Recent Scans Main Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Section Header & Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 p-4 lg:flex-row lg:items-center lg:justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Top 10 Recent Scans</h3>
              <span className="rounded-full bg-[#e6f4f1] px-2 py-0.5 text-xs font-semibold text-[#0f5449]">
                {top10Scans.length} Scans
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest recorded echo scans, status and clinical findings
            </p>
          </div>

          {/* Right Side Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, ID, findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-52 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            {/* Scan Type Filter Pills */}
            <div className="flex items-center rounded-xl bg-slate-100/80 p-0.5">
              {['All', 'Adult Echo', 'Fetal Echo', 'Pediatric Echo', 'Ultrasound'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedScanType(type)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    selectedScanType === type
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Datewise Filter Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold shadow-2xs transition ${
                  dateFilter !== 'All'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Date: {dateFilter}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* Datewise Filter Dropdown Popover */}
              {isDateMenuOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-emerald-600" />
                      Date Filter
                    </span>
                    {dateFilter !== 'All' && (
                      <button
                        type="button"
                        onClick={() => {
                          setDateFilter('All')
                          setIsDateMenuOpen(false)
                        }}
                        className="text-[11px] text-emerald-600 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="py-1 space-y-0.5">
                    {[
                      { label: 'All Dates', value: 'All' },
                      { label: 'Today', value: 'Today' },
                      { label: 'Yesterday', value: 'Yesterday' },
                      { label: 'Last 7 Days', value: 'Last 7 Days' },
                      { label: 'Last 30 Days', value: 'Last 30 Days' },
                      { label: 'This Month', value: 'This Month' },
                      { label: 'Custom Date Range', value: 'Custom' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setDateFilter(opt.value)
                          if (opt.value !== 'Custom') setIsDateMenuOpen(false)
                        }}
                        className={`w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center justify-between ${
                          dateFilter === opt.value
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {dateFilter === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>}
                      </button>
                    ))}
                  </div>

                  {dateFilter === 'Custom' && (
                    <div className="border-t border-slate-100 p-2 space-y-2 bg-slate-50 rounded-xl mt-1">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500">From Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500">To Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDateMenuOpen(false)}
                        className="w-full rounded-lg bg-emerald-600 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
                      >
                        Apply Filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export Button */}
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">PATIENT DETAILS</th>
                <th className="py-3 px-4">SCAN TYPE</th>
                <th className="py-3 px-4">DATE & TIME</th>
                <th className="py-3 px-4">AI FINDINGS (SUMMARY)</th>
                <th className="py-3 px-4">CLINICAL IMPORTANCE</th>
                <th className="py-3 px-4">AI CONFIDENCE</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {top10Scans.map((scan, idx) => (
                <tr
                  key={scan.id}
                  onClick={() => navigate(`${scan.scanRoute}/${scan.id}?patientId=${scan.patientId}&visitId=${scan.visitId || ''}&scatter=true`)}
                  className="group cursor-pointer transition hover:bg-slate-50/80"
                >
                  {/* Row # */}
                  <td className="py-3.5 px-4 text-slate-400 font-semibold">{idx + 1}</td>

                  {/* Patient Info */}
                  <td
                    className="py-3.5 px-4"
                    onClick={(event) => {
                      event.stopPropagation()
                      if (scan.patientId) navigate(`/visits?patient=${scan.patientId}`)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-xs font-bold text-white shadow-2xs"
                      >
                        {scan.initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                          {scan.patientName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {scan.patientCode} · {scan.demographics}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Scan Type Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        scan.scanType === 'Adult Echo'
                          ? 'bg-purple-100/70 text-purple-700'
                          : scan.scanType === 'Fetal Echo'
                          ? 'bg-pink-100/70 text-pink-700'
                          : 'bg-orange-100/70 text-orange-700'
                      }`}
                    >
                      {scan.scanType}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <p className="font-bold text-slate-900">{scan.dateTime}</p>
                    <p className="text-[11px] text-slate-400">{scan.timeStr}</p>
                  </td>

                  {/* AI Findings Summary */}
                  <td className="py-3.5 px-4 max-w-xs font-medium text-slate-700 truncate">
                    {scan.aiSummary}
                  </td>

                  {/* Clinical Importance Pill */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-0.5 text-[11px] font-semibold text-emerald-600 border border-emerald-200/50">
                      {scan.importance}
                    </span>
                  </td>

                  {/* AI Confidence */}
                  <td className="py-3.5 px-4 text-slate-400 font-medium">
                    {scan.confidence === null ? 'Not available' : `${scan.confidence}%`}
                  </td>

                  {/* Action Icon Buttons */}
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`${scan.scanRoute}/${scan.id}?patientId=${scan.patientId}`)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="View Echo Report"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/visits?patient=${scan.patientId}`)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="View Patient Details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoadingScans && top10Scans.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-xs text-slate-500">
                    No scans match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-700">1</span> to{' '}
            <span className="font-semibold text-slate-700">{top10Scans.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{top10Scans.length}</span> results
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-300 disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500 bg-emerald-50 text-xs font-bold text-emerald-700"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-300 disabled:opacity-50"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
