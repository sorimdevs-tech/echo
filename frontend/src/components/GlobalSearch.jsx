import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  User,
  Phone,
  Calendar,
  ChevronRight,
  UserPlus,
  Sparkles,
} from 'lucide-react'
import { patientService } from '../api/patientService'

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState([])
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  // Load patients list for search indexing
  useEffect(() => {
    let isMounted = true
    patientService
      .getPatients()
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
          setPatients(list)
        }
      })
      .catch((err) => console.error('Global search index load error:', err))

    return () => {
      isMounted = false
    }
  }, [])

  // Keyboard shortcut Ctrl+K / Cmd+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Perform search filtering across Patient ID, First Name, Last Name, Mobile / Phone
  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    const filtered = patients.filter((patient) => {
      const pid = String(patient.patient_id || patient.id || '').toLowerCase()
      const firstName = String(patient.first_name || '').toLowerCase()
      const lastName = String(patient.last_name || '').toLowerCase()
      const fullName = `${patient.salutation || ''} ${firstName} ${patient.middle_name || ''} ${lastName}`.toLowerCase()
      const mobile = String(patient.mobile || patient.phone1 || patient.phone2 || '').toLowerCase()

      return (
        pid.includes(q) ||
        firstName.includes(q) ||
        lastName.includes(q) ||
        fullName.includes(q) ||
        mobile.includes(q)
      )
    })

    setResults(filtered.slice(0, 8)) // top 8 results
    setIsOpen(true)
    setIsLoading(false)
    setSelectedIndex(-1)
  }, [query, patients])

  const handleSelectPatient = (patient) => {
    setIsOpen(false)
    setQuery('')
    navigate(`/visits?patient=${patient.id}`)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelectPatient(results[selectedIndex])
    } else if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      setIsOpen(false)
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const formatFullName = (p) => {
    return [p.salutation, p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ').trim() || 'Unknown Name'
  }

  const getInitials = (p) => {
    const first = p.first_name ? p.first_name.charAt(0).toUpperCase() : ''
    const last = p.last_name ? p.last_name.charAt(0).toUpperCase() : ''
    return (first + last) || 'P'
  }

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input Field */}
      <div className="group relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4 transition-transform group-focus-within:text-emerald-600" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search patient, ID, scan type..."
          className="h-9 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-14 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
        />

        <div className="absolute right-2.5 flex items-center pointer-events-none">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setIsOpen(false)
              }}
              className="pointer-events-auto rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-2xs">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Results Dropdown Modal */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Patient Matches ({results.length})
            </span>
            <span className="text-[11px] text-slate-400">Search by ID, Name, or Mobile</span>
          </div>

          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 py-1">
              {results.map((patient, index) => {
                const isSelected = index === selectedIndex
                const fullName = formatFullName(patient)
                const mobile = patient.mobile || patient.phone1 || 'No mobile'
                const displayId = patient.patient_id || `PAT-${patient.id}`

                return (
                  <div
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`group flex items-center justify-between gap-3 rounded-xl p-2.5 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-emerald-50/80 text-emerald-950 border border-emerald-200/60 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {/* Patient Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 font-bold text-white text-xs shadow-2xs">
                        {getInitials(patient)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {fullName}
                          </p>
                          <span className="inline-flex shrink-0 items-center rounded-md bg-emerald-100/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/50">
                            {displayId}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {mobile}
                          </span>
                          {patient.gender && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-slate-400" />
                              {patient.gender} {patient.age ? `(${patient.age}y)` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons on hover */}
                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsOpen(false)
                          navigate(`/visits?patient=${patient.id}`)
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95"
                      >
                        <Calendar className="h-3 w-3" />
                        <span>Visits</span>
                      </button>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-6 text-center">
              <User className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-700">No patients found for "{query}"</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Try searching by Patient ID, First Name, Last Name, or Mobile Number.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/patients/new')
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Add New Patient</span>
                </button>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  navigate(`/search?q=${encodeURIComponent(query)}`)
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition flex items-center justify-center gap-1 w-full"
              >
                <span>View all search results in Patient Directory</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
