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
  if (!patient) return ''
  return [patient.salutation, patient.first_name, patient.middle_name, patient.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || patient.patient_id || 'Patient record'
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
  if (scan.abnormal) return 'High'
  if (scan.ambiguity || scan.normalVariant) return 'Medium'
  return 'Low'
}

const getReportDetails = (scan, visit) => {
  const report = scan?.fetal_echo_report || scan?.adult_echo_report || scan?.pediatric_echo_report || scan?.report_data || {}
  const impression = report?.impression?.final_impression || report?.final_impression
  return scan?.findings || scan?.conclusion || scan?.diagnosis || impression || visit?.diagnosis || visit?.visit_type || 'Visit recorded. Open the visit to complete the report.'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total_patients: 101,
    total_scans: 137,
    total_visits: 142,
    todays_visits: 0,
    upcoming_visits: 22,
    adult_echo: 81,
    fetal_echo: 26,
    pediatric_echo: 30,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScanType, setSelectedScanType] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false)
  const [recentScans, setRecentScans] = useState([])
  const [isLoadingScans, setIsLoadingScans] = useState(true)

  useEffect(() => {
    Promise.all([
      scanService.getDashboardStats(),
      patientService.getAllVisits(),
      patientService.getPatients(),
      scanService.getScans(),
    ])
      .then(([statsResult, visitsResult, patientsResult, scansResult]) => {
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
          }))
        }

        const patients = asList(patientsResult)
        const patientLookup = buildPatientLookup(patients)
        const scans = asList(scansResult)
        const visitsById = new Map(asList(visitsResult).map((visit) => [normalizeLookupId(visit.id), visit]))
        const scannedVisitIds = new Set(scans.map((scan) => normalizeLookupId(scan.visit_id)).filter(Boolean))

        const toDashboardRow = (scan, visit) => {
            const patient = findPatientForScan(scan || visit, patientLookup) || findPatientForScan(visit || scan, patientLookup)
            // Never show a placeholder/unknown patient: records without a valid patient link are omitted.
            if (!patient) return null
            const { dateTime, timeStr, rawDate } = formatScanDate(scan?.scan_date || visit?.visit_date || scan?.created_at || visit?.created_at)
            const patientName = formatPatientName(patient)
            const initials = [patient?.first_name, patient?.last_name]
              .filter(Boolean)
              .map((part) => part.charAt(0).toUpperCase())
              .join('')
              .slice(0, 2) || 'AB'
            const scanType = scan?.scan_type || visit?.scan_type || 'Fetal Echo'

            return {
              id: scan ? `scan-${scan.id}` : `visit-${visit.id}`,
              patientId: patient.id,
              visitId: scan?.visit_id || visit?.id || '',
              patientName,
              patientCode: patient.patient_id || `PAT${patient.id}`,
              demographics: formatDemographics(patient),
              initials,
              scanType,
              scanRoute: scanRoutes[scanType] || '/fetal-echo-report',
              dateTime,
              timeStr,
              rawDate,
              aiSummary: getReportDetails(scan, visit),
              importance: getClinicalImportance(scan || {}),
              confidence: scan?.ai_confidence || scan?.confidence || 'Not recorded',
              referralDoctor: scan?.referralDoctor || visit?.referral_doctor || '—',
              searchText: [
                patient?.dob,
                patient?.mobile,
                patient?.phone1,
                patient?.phone2,
                patient?.email,
                visit?.referral_doctor,
                visit?.visit_type,
                scan?.scan_type,
                scan?.findings,
                scan?.conclusion,
                scan?.diagnosis,
              ].filter(Boolean).join(' '),
            }
        }

        // Most historic data has a scan but no visit_id. Start with scans so the
        // grid retains adult, fetal and pediatric report details, then include
        // only unscanned visits as a fallback.
        const dashboardRows = [
          ...scans.map((scan) => toDashboardRow(scan, visitsById.get(normalizeLookupId(scan.visit_id)))).filter(Boolean),
          ...asList(visitsResult)
            .filter((visit) => !scannedVisitIds.has(normalizeLookupId(visit.id)))
            .map((visit) => toDashboardRow(null, visit))
            .filter(Boolean),
        ].sort((left, right) => {
          const rightDate = right.rawDate?.getTime() || 0
          const leftDate = left.rawDate?.getTime() || 0
          return rightDate - leftDate
        })

        setRecentScans(dashboardRows)
      })
      .catch(() => setRecentScans([]))
      .finally(() => setIsLoadingScans(false))
  }, [])

  // 8 Card Stat Section Config matching exact design mockup
  const statCards = [
    {
      title: 'TOTAL PATIENTS',
      value: stats.total_patients,
      change: '↑ 12 this week',
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
      change: '↑ 18 this week',
      isPositive: true,
      icon: Activity,
      iconBg: 'bg-[#3b82f6]', // blue
      strokeColor: '#3b82f6',
      path: 'M0,24 Q15,20 30,22 T60,14 T90,16 T120,5',
      link: '/reports',
    },
    {
      title: 'TOTAL VISITS',
      value: stats.total_visits,
      change: '↑ 14 this week',
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
      change: '~ Same as yesterday',
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
      change: '↑ 10 this week',
      isPositive: true,
      icon: Heart,
      iconBg: 'bg-[#7c3aed]', // purple
      strokeColor: '#7c3aed',
      link: '/adult-echo-report',
    },
    {
      title: 'FETAL ECHO',
      value: stats.fetal_echo,
      change: '↑ 4 this week',
      isPositive: true,
      icon: Baby,
      iconBg: 'bg-[#ec4899]', // pink
      strokeColor: '#ec4899',
      link: '/fetal-echo-report',
    },
    {
      title: 'PEDIATRIC ECHO',
      value: stats.pediatric_echo,
      change: '↑ 6 this week',
      isPositive: true,
      icon: Smile,
      iconBg: 'bg-[#f97316]', // orange
      strokeColor: '#f97316',
      link: '/pediatric-echo-report',
    },
  ]

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
        const matchExtra = scan.searchText.toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchSummary && !matchExtra) return false
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

  // Limit to Top 10 Recent Visits
  const top10Scans = useMemo(() => dateFilteredScans.slice(0, 10), [dateFilteredScans])

  // Export Filtered Visits as CSV
  const handleExport = () => {
    const headers = ['#', 'Patient Name', 'Patient ID', 'Scan Type', 'Date', 'Time', 'Visit Summary', 'Importance']
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
    link.setAttribute('download', `recent_visits_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-5 select-none">
      {/* 8 Stat Cards Grid (4 columns x 2 rows) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.link)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${card.iconBg}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{card.title}</p>
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 leading-none mt-1">{card.value}</h3>
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

                {/* Sparkline Graphic (for first 4 cards) */}
                {card.path && (
                  <div className="w-16 h-8 flex items-center justify-end opacity-80 group-hover:opacity-100 transition-opacity">
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
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Top 10 Recent Visits Main Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Section Header & Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 p-4 lg:flex-row lg:items-center lg:justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Top 10 Recent Visits</h3>
              <span className="rounded-full bg-[#e6f4f1] px-2 py-0.5 text-xs font-semibold text-[#0f5449]">
                {top10Scans.length} Visits
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest patient visits across Adult, Fetal and Pediatric Echo workflows
            </p>
          </div>

          {/* Right Side Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, ID, DOB, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-52 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            {/* Scan Type Filter Pills */}
            <div className="flex items-center rounded-xl bg-slate-100/80 p-0.5">
              {['All', 'Adult Echo', 'Fetal Echo', 'Pediatric Echo'].map((type) => (
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
                <th className="py-3 px-4">REPORT DETAILS</th>
                <th className="py-3 px-4">CLINICAL IMPORTANCE</th>
                <th className="py-3 px-4">AI CONFIDENCE</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {top10Scans.map((scan, idx) => (
                <tr
                  key={scan.id}
                  onClick={() => navigate(`${scan.scanRoute}?patientId=${scan.patientId}&visitId=${scan.visitId || ''}&scatter=true`)}
                  className="group cursor-pointer transition hover:bg-slate-50/80"
                >
                  {/* Row # */}
                  <td className="py-3.5 px-4 text-slate-400 font-semibold">{idx + 1}</td>

                  {/* Patient Info */}
                  <td
                    className="py-3.5 px-4"
                    onClick={(event) => {
                      event.stopPropagation()
                      if (scan.patientId) navigate(`/patients/${scan.patientId}/records`)
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
                    {scan.confidence}
                  </td>

                  {/* Action Icon Buttons */}
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`${scan.scanRoute}?patientId=${scan.patientId}&visitId=${scan.visitId || ''}&scatter=true`)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="View Echo Report"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/patients/${scan.patientId}/records`)}
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
                    No visits match the selected filters.
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
