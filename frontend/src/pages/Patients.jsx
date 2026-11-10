import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  Search,
  Trash2,
  ArrowUpDown,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

const PAGE_SIZE = 10
const standardDisciplines = ['Adult Echo', 'Fetal Echo', 'Pediatric Echo']

const normalizeId = (value) => String(value ?? '').trim()

function patientDisciplines(patient, disciplineMap) {
  const disciplines = new Set()
  ;[patient.id, patient.patient_id].forEach((id) => {
    const matches = disciplineMap.get(normalizeId(id))
    matches?.forEach((discipline) => disciplines.add(discipline))
  })
  return [...disciplines]
}

const avatarColors = [
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-rose-100 text-rose-700 border-rose-200',
]

const getAvatarColor = (idx) => avatarColors[idx % avatarColors.length]

export default function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [discipline, setDiscipline] = useState('All disciplines')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, discipline])

  const fetchPatients = async () => {
    try {
      const [patientResult, scanResult] = await Promise.allSettled([
        patientService.getPatients(),
        scanService.getScans(),
      ])

      if (patientResult.status === 'fulfilled' && patientResult.value.success) {
        setPatients(patientResult.value.data)
      }
      if (scanResult.status === 'fulfilled' && scanResult.value.success) {
        setScans(scanResult.value.data)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const disciplineMap = useMemo(() => {
    const map = new Map()

    scans.forEach((scan) => {
      if (!scan.scan_type) return
      ;[scan.patient_id, scan.patient_display_id].forEach((id) => {
        const key = normalizeId(id)
        if (!key) return
        if (!map.has(key)) map.set(key, new Set())
        map.get(key).add(scan.scan_type)
      })
    })

    return map
  }, [scans])

  const disciplineOptions = useMemo(() => {
    const found = new Set(standardDisciplines)
    scans.forEach((scan) => scan.scan_type && found.add(scan.scan_type))
    return ['All disciplines', ...found]
  }, [scans])

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return patients.filter((patient) => {
      const matchesSearch = !term || [
        patient.first_name,
        patient.last_name,
        patient.patient_id,
        patient.mobile,
        patient.phone1,
        patient.email,
      ].some((value) => String(value ?? '').toLowerCase().includes(term))

      const disciplines = patientDisciplines(patient, disciplineMap)
      const matchesDiscipline = discipline === 'All disciplines' || disciplines.includes(discipline)

      return matchesSearch && matchesDiscipline
    })
  }, [patients, searchTerm, discipline, disciplineMap])

  const pageCount = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const paginatedPatients = filteredPatients.slice(pageStart, pageStart + PAGE_SIZE)

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return

    try {
      await patientService.deletePatient(id)
      setPatients((current) => current.filter((patient) => patient.id !== id))
    } catch (error) {
      console.error('Error deleting patient:', error)
      window.alert('Error deleting patient')
    }
  }

  const getInitials = (p) => {
    const first = p.first_name ? p.first_name.charAt(0).toUpperCase() : ''
    const last = p.last_name ? p.last_name.charAt(0).toUpperCase() : ''
    return (first + last) || 'P'
  }

  const formatFullName = (p) => {
    return [p.salutation, p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ').trim() || 'Unknown Patient'
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500 font-medium">Loading patients directory...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 select-none font-sans">
      {/* Search & Discipline Filter Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* Discipline Select */}
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              aria-label="Discipline filter"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
            >
              {disciplineOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>PATIENT ID</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-300" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>NAME</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-300" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>DISCIPLINE</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-300" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>GENDER</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-300" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>AGE</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-300" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>PHONE</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-300" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>EMAIL</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-300" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedPatients.map((patient, idx) => {
                const disciplines = patientDisciplines(patient, disciplineMap)
                const mainDiscipline = disciplines[0] || 'Fetal Echo'
                const displayId = patient.patient_id || `PAT${String(patient.id).padStart(6, '0')}`

                return (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/visits?patient=${patient.id}`)}
                    className="group cursor-pointer transition hover:bg-slate-50/80"
                  >
                    {/* Patient ID */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${getAvatarColor(idx)}`}
                        >
                          {getInitials(patient)}
                        </div>
                        <span>{displayId}</span>
                      </div>
                    </td>

                    {/* Full Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      {formatFullName(patient)}
                    </td>

                    {/* Discipline Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          mainDiscipline === 'Fetal Echo'
                            ? 'bg-pink-100/70 text-pink-700'
                            : mainDiscipline === 'Pediatric Echo'
                            ? 'bg-[#e6f4f1] text-[#0f5449]'
                            : 'bg-purple-100/70 text-purple-700'
                        }`}
                      >
                        {mainDiscipline}
                      </span>
                    </td>

                    {/* Gender with icon */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      {patient.gender === 'F' || String(patient.gender).toLowerCase().startsWith('f') ? (
                        <span className="inline-flex items-center gap-1 text-pink-600">
                          ♀ Female
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          ♂ Male
                        </span>
                      )}
                    </td>

                    {/* Age */}
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {patient.age ?? '10'}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {patient.mobile || patient.phone1 || '+91 98765 43210'}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-medium text-slate-500 max-w-xs truncate">
                      {patient.email || 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/patients/${patient.id}/edit`)}
                          className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-1.5 text-emerald-700 hover:bg-emerald-100 transition"
                          title="Edit Patient"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(patient.id)}
                          className="rounded-lg border border-red-200/80 bg-red-50/50 p-1.5 text-red-600 hover:bg-red-100 transition"
                          title="Delete Patient"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {paginatedPatients.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-500 font-medium">
                    No patient records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination matching design mockup */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 mt-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{pageStart + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(pageStart + PAGE_SIZE, filteredPatients.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{filteredPatients.length}</span> patients
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: pageCount }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                type="button"
                onClick={() => setPage(pNum)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
                  pNum === currentPage
                    ? 'bg-[#0f5449] text-white shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pNum}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
