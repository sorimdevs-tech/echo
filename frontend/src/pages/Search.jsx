import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  Camera,
  ClipboardList,
  FileText,
  Image,
  Pencil,
  Power,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search as SearchIcon,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

const initialSearchForm = {
  patient_id: '',
  first_name: '',
  last_name: '',
  mobile: '',
  phone: '',
  visit_date_from: '',
  visit_date_to: '',
  ref_doctor: '',
  aadhaar: '',
  cross_ref_id: '',
  scan_type: '',
  investigation_status: '',
  qr_code: false,
}

const scanTypes = ['Adult Echo', 'Fetal Echo', 'Pediatric Echo']
const investigationStatuses = ['Pending', 'In Progress', 'Completed']

const quickActions = [
  { label: 'Template', icon: ClipboardList, tone: 'text-teal-700 bg-teal-50 border-teal-100' },
  { label: 'Ref. letter', icon: FileText, tone: 'text-blue-700 bg-blue-50 border-blue-100' },
  { label: 'Images', icon: Image, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
  { label: 'Capture', icon: Camera, tone: 'text-rose-700 bg-rose-50 border-rose-100' },
  { label: 'Close', icon: Power, tone: 'text-slate-700 bg-slate-50 border-slate-200' },
]

const patientColumns = [
  { label: 'Patient ID', keys: ['patient_id'] },
  { label: 'First name', keys: ['first_name'] },
  { label: 'Last name', keys: ['last_name'] },
  { label: 'Street', keys: ['street'] },
  { label: 'Area', keys: ['area', 'area_po'] },
  { label: 'Date of birth', keys: ['dob', 'date_of_birth'] },
  { label: 'Phone', keys: ['mobile', 'phone1', 'phone'] },
  { label: 'Cross. Ref.', keys: ['cross_ref_id', 'cross_ref', 'cross_reference_id', 'cross_reference'] },
  { label: 'Aadhaar no', keys: ['aadhaar_no', 'aadhaar'] },
]

const getValue = (record, keys, fallback = '') => {
  if (!record) return fallback

  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }

  return fallback
}

const normalize = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')

const normalizeId = (value) => String(value ?? '').trim()

const patientLookupIds = (patient) =>
  [patient?.id, patient?.patient_id].map(normalizeId).filter(Boolean)

const includesValue = (record, keys, term) => {
  if (!term) return true
  return keys.some((key) => normalize(record?.[key]).includes(normalize(term)))
}

const formatDateTime = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isWithinDateRange = (value, from, to) => {
  if (!from && !to) return true
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  if (from) {
    const start = new Date(from)
    start.setHours(0, 0, 0, 0)
    if (date < start) return false
  }

  if (to) {
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)
    if (date > end) return false
  }

  return true
}

function SearchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [patients, setPatients] = useState([])
  const [visiblePatients, setVisiblePatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [visits, setVisits] = useState([])
  const [scans, setScans] = useState([])
  const [allScans, setAllScans] = useState([])
  const [searchForm, setSearchForm] = useState(initialSearchForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')
  const searchFormRef = useRef(null)

  useEffect(() => {
    loadPatients()
  }, [])

  const selectedPatientName = useMemo(() => {
    if (!selectedPatient) return 'No patient selected'

    const name = [
      getValue(selectedPatient, ['first_name']),
      getValue(selectedPatient, ['last_name']),
    ]
      .filter(Boolean)
      .join(' ')

    return name || getValue(selectedPatient, ['patient_id'], 'Selected patient')
  }, [selectedPatient])

  const loadPatients = async () => {
    setIsLoading(true)
    setStatusMessage('')

    try {
      const [patientsResult, scansResult] = await Promise.all([
        patientService.getPatients(),
        scanService.getScans().catch(() => ({ success: false, data: [] })),
      ])

      const nextPatients = patientsResult.success ? patientsResult.data : []
      const nextScans = scansResult.success ? scansResult.data : []

      setPatients(nextPatients)
      setVisiblePatients([])
      setAllScans(nextScans)

      setSelectedPatient(null)
      setVisits([])
      setScans([])
      setStatusMessage('Use search criteria to find patients.')
    } catch (error) {
      console.error('Error fetching patients:', error)
      setPatients([])
      setVisiblePatients([])
      setSelectedPatient(null)
      setVisits([])
      setScans([])
      setStatusMessage('Unable to load patient data. Please check the API connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectPatient = async (patient, options = {}) => {
    setSelectedPatient(patient)
    setIsDetailsLoading(true)

    try {
      const [visitsResult, scansResult] = await Promise.all([
        patientService.getVisits(patient.id),
        scanService.getScansByPatient(patient.id),
      ])

      const scanSource = options.scanList || allScans
      const fallbackScans = scanSource.filter((scan) => {
        const scanPatientId = normalizeId(getValue(scan, ['patient_id', 'patientId', 'patient']))
        return patientLookupIds(patient).includes(scanPatientId)
      })

      setVisits(visitsResult.success ? visitsResult.data : [])
      setScans(scansResult.success && scansResult.data.length > 0 ? scansResult.data : fallbackScans)

      if (options.showMessage !== false) {
        setStatusMessage(`Selected ${getValue(patient, ['patient_id'], 'patient')}`)
      }
    } catch (error) {
      console.error('Error loading patient details:', error)
      setVisits([])
      setScans([])
      setStatusMessage('Patient selected, but visits or scans could not be loaded.')
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const updateField = (field, value) => {
    setSearchForm((current) => ({ ...current, [field]: value }))
  }

  const scrollToSearch = () => {
    setIsQuickSearchOpen((prevOpen) => !prevOpen)
    setTimeout(() => {
      searchFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  const handleQuickSearch = (event) => {
    event.preventDefault()
    setSearchForm((current) => ({
      ...initialSearchForm,
      first_name: quickSearch,
      last_name: quickSearch,
      patient_id: quickSearch,
    }))
    handleSearch(event)
    setTimeout(() => {
      setIsQuickSearchOpen(false)
    }, 400)
  }

  const loadVisitMatches = async () => {
    const needsVisitSearch =
      searchForm.visit_date_from || searchForm.visit_date_to || searchForm.ref_doctor

    if (!needsVisitSearch) return null

    let visitPatientIds = new Set()

    try {
      const results = await Promise.all(
        patients.map(async (patient) => {
          try {
            const result = await patientService.getVisits(patient.id)
            const patientVisits = result.success ? result.data : []

            const hasMatch = patientVisits.some((visit) => {
              const dateMatches = isWithinDateRange(
                visit.visit_date || visit.created_at,
                searchForm.visit_date_from,
                searchForm.visit_date_to,
              )
              const doctorMatches = includesValue(
                visit,
                ['referral_doctor', 'ref_doctor'],
                searchForm.ref_doctor,
              )

              return dateMatches && doctorMatches
            })

            return hasMatch ? patient.id : null
          } catch (error) {
            console.error(`Error searching visits for patient ${patient.id}:`, error)
            return null
          }
        }),
      )

      visitPatientIds = new Set(results.filter(Boolean))
    } catch (error) {
      console.error('Error loading visit matches:', error)
    }

    return visitPatientIds
  }

  const applyPatientFilters = async () => {
    const visitPatientIds = await loadVisitMatches()
    const scanPatientIds = new Set(
      allScans
        .filter((scan) => {
          const scanTypeMatches =
            !searchForm.scan_type || normalize(scan.scan_type) === normalize(searchForm.scan_type)
          const statusMatches =
            !searchForm.investigation_status ||
            normalize(scan.status).includes(normalize(searchForm.investigation_status))

          return scanTypeMatches && statusMatches
        })
        .map((scan) => normalizeId(getValue(scan, ['patient_id', 'patientId', 'patient'])))
        .filter((id) => id),
    )

    return patients.filter((patient) => {
      const directReferralMatches = includesValue(
        patient,
        ['referral_doctor', 'ref_doctor', 'referring_doctor'],
        searchForm.ref_doctor,
      )

      const patientMatches =
        includesValue(patient, ['patient_id', 'id'], searchForm.patient_id) &&
        includesValue(patient, ['first_name'], searchForm.first_name) &&
        includesValue(patient, ['last_name'], searchForm.last_name) &&
        includesValue(patient, ['mobile', 'mobile_no', 'phone1', 'phone'], searchForm.mobile) &&
        includesValue(patient, ['phone1', 'phone2', 'phone', 'telephone', 'mobile'], searchForm.phone) &&
        includesValue(patient, ['aadhaar_no', 'aadhaar', 'aadhar_no', 'aadhar'], searchForm.aadhaar) &&
        includesValue(
          patient,
          ['cross_ref_id', 'cross_ref', 'cross_reference_id', 'cross_reference'],
          searchForm.cross_ref_id,
        )

      const hasDateCriteria = searchForm.visit_date_from || searchForm.visit_date_to
      const visitIdMatches = !visitPatientIds || visitPatientIds.has(patient.id)
      const referralMatches =
        !searchForm.ref_doctor || directReferralMatches || visitPatientIds.has(patient.id)
      const needsScanFilter = searchForm.scan_type || searchForm.investigation_status
      const scanMatches =
        !needsScanFilter || patientLookupIds(patient).some((id) => scanPatientIds.has(id))
      const visitMatches = hasDateCriteria ? visitIdMatches : referralMatches

      return patientMatches && scanMatches && visitMatches
    })
  }

  const handleSearch = async (event) => {
    event?.preventDefault()
    if (isLoading || isSearching) return

    setIsSearching(true)
    setStatusMessage('Searching patient records...')

    try {
      const filtered = await applyPatientFilters()
      setVisiblePatients(filtered)

      if (filtered.length > 0) {
        await selectPatient(filtered[0], { showMessage: false })
        setStatusMessage(`${filtered.length} patient${filtered.length === 1 ? '' : 's'} found`)
      } else {
        setSelectedPatient(null)
        setVisits([])
        setScans([])
        setStatusMessage('No patients found for this search.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchForm(initialSearchForm)
    setVisiblePatients([])
    setStatusMessage('Use search criteria to find patients.')

    setSelectedPatient(null)
    setVisits([])
    setScans([])
  }

  return (
    <>
          {isQuickSearchOpen && (
            <div className="shrink-0 overflow-hidden rounded-xl border border-teal-200 bg-white shadow-sm transition-all duration-300">
              <form onSubmit={handleQuickSearch} className="px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-teal-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100">
                    <SearchIcon className="h-4 w-4 shrink-0 text-slate-500" />
                    <input
                      type="text"
                      value={quickSearch}
                      onChange={(event) => setQuickSearch(event.target.value)}
                      placeholder="Search by patient ID, name, or mobile..."
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setQuickSearch('')
                        setIsQuickSearchOpen(false)
                      }}
                      className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || isSearching}
                      className="primary-button disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      <SearchIcon className="h-4 w-4" />
                      <span>{isSearching ? 'Searching' : 'Search'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickSearch('')
                        setIsQuickSearchOpen(false)
                      }}
                      className="secondary-button"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
          <form onSubmit={handleSearch} className="shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Search criteria</h2>
                <p className="text-xs text-slate-500">Use any available field to find and select a patient.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={searchForm.qr_code}
                    onChange={(event) => updateField('qr_code', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                  />
                  <QrCode className="h-4 w-4 text-slate-500" />
                  <span>QR code</span>
                </label>
                <button
                  type="submit"
                  disabled={isLoading || isSearching}
                  className="primary-button disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  <SearchIcon className="h-4 w-4" />
                  <span>{isSearching ? 'Searching' : 'Search'}</span>
                </button>
                <button type="button" onClick={clearSearch} className="secondary-button">
                  <RotateCcw className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <TextField
                label="Patient Id"
                value={searchForm.patient_id}
                onChange={(value) => updateField('patient_id', value)}
              />
              <TextField
                label="First name"
                value={searchForm.first_name}
                onChange={(value) => updateField('first_name', value)}
              />
              <TextField
                label="Last name"
                value={searchForm.last_name}
                onChange={(value) => updateField('last_name', value)}
              />
              <TextField
                label="Mobile"
                value={searchForm.mobile}
                onChange={(value) => updateField('mobile', value)}
              />
              <TextField
                label="Phone"
                value={searchForm.phone}
                onChange={(value) => updateField('phone', value)}
              />
              <TextField
                label="Aadhaar"
                value={searchForm.aadhaar}
                onChange={(value) => updateField('aadhaar', value)}
              />
              <TextField
                label="Visit date from"
                type="date"
                value={searchForm.visit_date_from}
                onChange={(value) => updateField('visit_date_from', value)}
              />
              <TextField
                label="To date"
                type="date"
                value={searchForm.visit_date_to}
                onChange={(value) => updateField('visit_date_to', value)}
              />
              <TextField
                label="Ref. Dr."
                value={searchForm.ref_doctor}
                onChange={(value) => updateField('ref_doctor', value)}
              />
              <TextField
                label="Cross Ref. Id"
                value={searchForm.cross_ref_id}
                onChange={(value) => updateField('cross_ref_id', value)}
              />
              <SelectField
                label="Scan type"
                value={searchForm.scan_type}
                onChange={(value) => updateField('scan_type', value)}
                options={scanTypes}
              />
              <SelectField
                label="Investigation status"
                value={searchForm.investigation_status}
                onChange={(value) => updateField('investigation_status', value)}
                options={investigationStatuses}
              />
            </div>
          </form>

          <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="flex min-h-0 min-w-0 flex-col gap-3">
              <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
                <SectionHeader
                  title="Patient information"
                  detail={
                    isLoading
                      ? 'Loading patients...'
                      : visiblePatients.length > 0
                        ? `${visiblePatients.length} of ${patients.length} records`
                        : 'No patients loaded'
                  }
                />
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="data-table min-w-[980px]">
                    <thead>
                      <tr>
                        <th className="w-10" aria-label="Selected patient" />
                        {patientColumns.map((column) => (
                          <th key={column.label}>{column.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePatients.map((patient) => {
                        const isSelected = patient.id === selectedPatient?.id

                        return (
                          <tr
                            key={patient.id}
                            onClick={() => selectPatient(patient)}
                            className={isSelected ? 'selected-row' : undefined}
                          >
                            <td>
                              <span
                                className={`mx-auto block h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-teal-600' : 'bg-slate-300'
                                  }`}
                              />
                            </td>
                            {patientColumns.map((column) => (
                              <td key={column.label}>{getValue(patient, column.keys, '-')}</td>
                            ))}
                          </tr>
                        )
                      })}
                      {!isLoading && visiblePatients.length === 0 && (
                        <tr>
                          <td colSpan={patientColumns.length + 1}>
                            <EmptyState message="No patients found. Use the search criteria above to find patients." />
                          </td>
                        </tr>
                      )}
                      {isLoading && (
                        <tr>
                          <td colSpan={patientColumns.length + 1}>
                            <EmptyState message="Loading patient records..." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid min-h-[220px] shrink-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
                <section className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
                  <SectionHeader
                    title="Visits"
                    detail={isDetailsLoading ? 'Loading visits...' : `${visits.length} visits`}
                  />
                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="data-table min-w-[680px]">
                      <thead>
                        <tr>
                          <th>No.</th>
                          <th>Date</th>
                          <th>Referral doctor</th>
                          <th>Image</th>
                          <th>AVI</th>
                          <th>Preg.</th>
                          <th>OB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visits.map((visit, index) => (
                          <tr key={visit.id || index}>
                            <td>{index + 1}</td>
                            <td>{formatDateTime(visit.visit_date || visit.created_at)}</td>
                            <td>{getValue(visit, ['referral_doctor', 'ref_doctor'], 'Self')}</td>
                            <td>{getValue(visit, ['image_count', 'image'], '0')}</td>
                            <td>{getValue(visit, ['avi'], '0')}</td>
                            <td>{getValue(visit, ['pregnancy', 'preg'], '0')}</td>
                            <td>{getValue(visit, ['ob'], '-')}</td>
                          </tr>
                        ))}
                        {!isDetailsLoading && visits.length === 0 && (
                          <tr>
                            <td colSpan="7">
                              <EmptyState message="No visits recorded for the selected patient." />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
                  <SectionHeader
                    title="Scans"
                    detail={
                      isDetailsLoading
                        ? 'Loading scans...'
                        : `${scans.length} scan${scans.length === 1 ? '' : 's'} for patient · ${allScans.length} total in CRM`
                    }
                  />
                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="data-table min-w-[360px]">
                      <thead>
                        <tr>
                          <th>Type of scan</th>
                          <th>Report title</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scans.map((scan, index) => (
                          <tr key={scan.id || index} className={index === 0 ? 'selected-row' : undefined}>
                            <td>{getValue(scan, ['scan_type'], '-')}</td>
                            <td>{getValue(scan, ['report_title', 'indicator', 'tag'], '-')}</td>
                          </tr>
                        ))}
                        {!isDetailsLoading && scans.length === 0 && (
                          <tr>
                            <td colSpan="2">
                              <EmptyState message="No scans recorded for the selected patient." />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            <aside className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Current patient</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-950">{selectedPatientName}</p>
                <p className="text-xs text-slate-500">{getValue(selectedPatient, ['patient_id'], 'Select a patient')}</p>
              </div>

              <div className="grid gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon

                  return (
                    <button
                      key={action.label}
                      type="button"
                      title={action.label}
                      className={`flex h-12 items-center gap-3 rounded-lg border px-3 text-left text-sm font-medium transition hover:-translate-y-px hover:shadow-sm ${action.tone}`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{action.label}</span>
                    </button>
                  )
                })}
              </div>
            </aside>
          </div>

          <footer className="flex shrink-0 flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span>{statusMessage || 'F2-New patient, F3-Edit patient, F4-Add visit, F5-Refresh, F8-Search by Today date'}</span>
            <span>{selectedPatient ? `Ready: ${getValue(selectedPatient, ['patient_id'], '-')}` : 'Click a row to select a patient'}</span>
          </footer>
        </>
  )
}

function TextField({ label, type = 'text', value, onChange }) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-control"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field-control">
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function SectionHeader({ title, detail }) {
  return (
    <div className="flex min-h-[52px] flex-col justify-center border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      {detail && <p className="mt-1 text-xs text-slate-500 sm:mt-0">{detail}</p>}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[88px] items-center justify-center px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

export default SearchPage
