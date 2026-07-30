import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Edit, Filter, Plus, Search, Trash2, UserPlus } from 'lucide-react'
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

function Patients() {
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading patients...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Manage patient records</p>
        </div>
        <Link to="/patients/new" className="btn-primary flex items-center space-x-2">
          <UserPlus className="h-4 w-4" />
          <span>New Patient</span>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              className="input pl-10"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <label className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              aria-label="Discipline filter"
              className="input appearance-none pl-10"
              value={discipline}
              onChange={(event) => setDiscipline(event.target.value)}
            >
              {disciplineOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No patients found</h3>
            <p className="mb-4 text-gray-500">Try another search or discipline.</p>
            <Link to="/patients/new" className="btn-primary inline-flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Patient</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Patient ID', 'Name', 'Discipline', 'Gender', 'Age', 'Phone', 'Email'].map((heading) => (
                      <th key={heading} className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {heading}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedPatients.map((patient) => {
                    const disciplines = patientDisciplines(patient, disciplineMap)

                    return (
                      <tr
                        key={patient.id}
                        onClick={() => navigate(`/visits?patient=${patient.id}`)}
                        className="cursor-pointer hover:bg-teal-50/60"
                        title="Open patient visits"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{patient.patient_id || 'N/A'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {patient.salutation} {patient.first_name} {patient.last_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex min-w-[130px] flex-wrap gap-1">
                            {disciplines.length ? disciplines.map((item) => (
                              <span key={item} className="rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-800">{item}</span>
                            )) : <span>Unassigned</span>}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{patient.age || 'N/A'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{patient.mobile || patient.phone1 || 'N/A'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{patient.email || 'N/A'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/patients/${patient.id}/edit`}
                              onClick={(event) => event.stopPropagation()}
                              className="p-1 text-primary-600 hover:text-primary-900"
                              aria-label={`Edit ${patient.first_name} ${patient.last_name}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                handleDelete(patient.id)
                              }}
                              className="p-1 text-red-600 hover:text-red-900"
                              aria-label={`Delete ${patient.first_name} ${patient.last_name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{pageStart + 1}</span>–<span className="font-medium">{Math.min(pageStart + PAGE_SIZE, filteredPatients.length)}</span> of{' '}
                <span className="font-medium">{filteredPatients.length}</span> patients
              </p>
              <div className="flex flex-wrap items-center gap-1" aria-label="Patient pagination">
                <button
                  type="button"
                  className="secondary-button h-9 px-3 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold ${
                      pageNumber === currentPage
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-primary-50'
                    }`}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  className="secondary-button h-9 px-3 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Patients
