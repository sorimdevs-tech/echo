import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Save,
  X,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  Activity,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { lookupOptionService } from '../api/lookupOptionService'
import { ReferralDoctorForm } from './NewReferralDoctor'

const scanTypes = ['Adult Echo', 'Fetal Echo', 'Pediatric Echo']
const patientLookupCategories = ['salutation', 'marital_status', 'ethnic_origin', 'country', 'state']

const initialPatientFormData = {
  patient_id: '',
  salutation: '',
  first_name: '',
  last_name: '',
  middle_name: '',
  age: '',
  dob: '',
  gender: 'M',
  marital_status: '',
  ethnic_origin: '',
  street: '',
  zip_code: '',
  country: '',
  state: '',
  district_city: '',
  email: '',
  phone1: '',
  phone2: '',
  mobile: '',
  fax: '',
  aadhaar_no: '',
  family_doctor: '',
  taluk: '',
  area: '',
  area_po: '',
}

const patientFormFields = Object.keys(initialPatientFormData)

function getPatientSaveError(error, actionLabel) {
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (error?.response?.status === 404) {
    return 'EchoScan API was not found. Make sure the EchoScan backend is running on port 8001.'
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot connect to the EchoScan backend. Make sure it is running on port 8001.'
  }

  return `Error ${actionLabel} patient`
}

function calculateAgeFromDob(dob) {
  if (!dob) return ''

  const birthDate = new Date(`${dob}T00:00:00`)
  if (Number.isNaN(birthDate.getTime())) return ''

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDelta = today.getMonth() - birthDate.getMonth()

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age >= 0 ? String(age) : ''
}

function groupLookupOptions(options) {
  return patientLookupCategories.reduce((grouped, category) => {
    grouped[category] = options
      .filter((option) => option.category === category)
      .map((option) => option.value)
    return grouped
  }, {})
}

function withCurrentValue(options, currentValue) {
  if (!currentValue || options.includes(currentValue)) {
    return options
  }

  return [...options, currentValue]
}

function buildPatientPayload(formData, selectedScans) {
  const payload = patientFormFields.reduce((nextPayload, field) => {
    nextPayload[field] = formData[field]
    return nextPayload
  }, {})

  payload.selected_scans = selectedScans

  return payload
}

function buildVisitPayload(visit) {
  return {
    visit_date: visit.visit_date || new Date().toISOString(),
    referral_doctor: visit.referral_doctor || '',
    image_count: visit.image_count || '0',
    avi: visit.avi || '0',
    pregnancy: visit.pregnancy || '0',
    ob: visit.ob || '',
  }
}

function isPersistedVisit(visit) {
  return typeof visit?.id === 'string' && visit.id.length > 0
}

function NewPatient({ mode = 'new', patientId = '' }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialPatientFormData)

  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(patientId)
  const [visits, setVisits] = useState([])
  const [selectedScans, setSelectedScans] = useState(mode === 'edit' ? scanTypes : [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPatient, setIsLoadingPatient] = useState(Boolean(patientId))
  const [isLoadingPatients, setIsLoadingPatients] = useState(mode === 'edit' || mode === 'visits')
  const [submitError, setSubmitError] = useState('')
  const [patientSelectError, setPatientSelectError] = useState('')
  const [visitStatusMessage, setVisitStatusMessage] = useState('')
  const [isSavingVisit, setIsSavingVisit] = useState(false)
  const [addingField, setAddingField] = useState(null)
  const [newValue, setNewValue] = useState('')
  const [lookupOptions, setLookupOptions] = useState(() => groupLookupOptions([]))
  const [optionError, setOptionError] = useState('')
  const [isReferralDoctorOpen, setIsReferralDoctorOpen] = useState(false)

  const isEditMode = mode === 'edit'
  const isVisitMode = mode === 'visits'
  const usesExistingPatient = isEditMode || isVisitMode
  const saveLabel = isEditMode ? 'Update Patient' : isVisitMode ? 'Save Patient Details' : 'Save Patient'

  useEffect(() => {
    const fetchLookupOptions = async () => {
      setOptionError('')

      try {
        const result = await lookupOptionService.getLookupOptions()
        if (result.success) {
          setLookupOptions(groupLookupOptions(result.data))
        }
      } catch (error) {
        console.error('Error loading lookup options:', error)
        setOptionError('Could not load dropdown options from the database.')
      }
    }

    fetchLookupOptions()
  }, [])

  useEffect(() => {
    if (!usesExistingPatient) return

    const fetchPatients = async () => {
      setIsLoadingPatients(true)
      setPatientSelectError('')

      try {
        const result = await patientService.getPatients()
        if (result.success) {
          setPatients(result.data)
        }
      } catch (error) {
        console.error('Error loading patient list:', error)
        setPatientSelectError(getPatientSaveError(error, 'loading'))
      } finally {
        setIsLoadingPatients(false)
      }
    }

    fetchPatients()
  }, [usesExistingPatient])

  useEffect(() => {
    if (!patientId) {
      setIsLoadingPatient(false)
      setSelectedPatientId('')
      return
    }

    setSelectedPatientId(patientId)
    loadPatient(patientId)
  }, [patientId])

  const loadPatient = async (nextPatientId) => {
    if (!nextPatientId) return

    setIsLoadingPatient(true)
    setSubmitError('')
    setVisitStatusMessage('')

    try {
      const [patientResult, visitsResult] = await Promise.all([
        patientService.getPatient(nextPatientId),
        patientService.getVisits(nextPatientId).catch(() => ({ success: false, data: [] })),
      ])

      if (patientResult.success) {
        const nextFormData = { ...initialPatientFormData, ...patientResult.data }
        const savedScans = patientResult.data.selected_scans || patientResult.data.scan_preferences?.selected_scans
        setFormData({
          ...nextFormData,
          age: nextFormData.dob ? calculateAgeFromDob(nextFormData.dob) : nextFormData.age,
        })
        if (Array.isArray(savedScans)) {
          setSelectedScans(savedScans)
        } else {
          setSelectedScans(isEditMode ? scanTypes : [])
        }
      }

      if (visitsResult.success) {
        setVisits(visitsResult.data)
      }
    } catch (error) {
      console.error('Error loading patient:', error)
      setSubmitError(getPatientSaveError(error, 'loading'))
    } finally {
      setIsLoadingPatient(false)
    }
  }

  const handlePatientSelect = (nextPatientId) => {
    setSelectedPatientId(nextPatientId)

    if (nextPatientId) {
      loadPatient(nextPatientId)
    } else {
      setFormData(initialPatientFormData)
      setVisits([])
      setSelectedScans(isEditMode ? scanTypes : [])
      setVisitStatusMessage('')
    }
  }

  const handleDobChange = (dob) => {
    setFormData((current) => ({
      ...current,
      dob,
      age: calculateAgeFromDob(dob),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const patientPayload = buildPatientPayload(formData, selectedScans)

      if (usesExistingPatient) {
        if (!selectedPatientId) {
          setSubmitError('Select a patient before updating this record.')
          return
        }
        await patientService.updatePatient(selectedPatientId, patientPayload)
      } else {
        await patientService.createPatient(patientPayload)
      }
      if (isVisitMode) {
        setSubmitError('')
        setVisitStatusMessage('Patient details saved.')
      } else {
        navigate('/search')
      }
    } catch (error) {
      console.error('Error saving patient:', error)
      setSubmitError(getPatientSaveError(error, usesExistingPatient ? 'updating' : 'creating'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddVisit = async () => {
    const newVisit = {
      id: Date.now(),
      visit_date: new Date().toISOString(),
      referral_doctor: '',
      image_count: '0',
      avi: '0',
      pregnancy: '0',
      ob: '',
    }

    if (!usesExistingPatient) {
      setVisits([...visits, newVisit])
      return
    }

    if (!selectedPatientId) {
      setVisitStatusMessage('')
      setSubmitError('Select a patient before adding a visit.')
      return
    }

    setIsSavingVisit(true)
    setSubmitError('')
    setVisitStatusMessage('')

    try {
      const result = await patientService.addVisit(selectedPatientId, buildVisitPayload(newVisit))
      if (result.success) {
        setVisits((current) => [result.data, ...current])
        setVisitStatusMessage('Visit added and linked to the selected patient.')
      }
    } catch (error) {
      console.error('Error adding visit:', error)
      setSubmitError('Could not add visit for the selected patient.')
    } finally {
      setIsSavingVisit(false)
    }
  }

  const handleUpdateVisit = (id, field, value) => {
    setVisitStatusMessage('')
    setVisits(visits.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const handleSaveVisit = async (visit) => {
    if (!selectedPatientId) {
      setSubmitError('Select a patient before saving a visit.')
      return
    }

    setIsSavingVisit(true)
    setSubmitError('')
    setVisitStatusMessage('')

    try {
      const result = isPersistedVisit(visit)
        ? await patientService.updateVisit(visit.id, buildVisitPayload(visit))
        : await patientService.addVisit(selectedPatientId, buildVisitPayload(visit))

      if (result.success) {
        setVisits((current) => current.map((item) => (
          item.id === visit.id ? result.data : item
        )))
        setVisitStatusMessage('Visit saved for the selected patient.')
      }
    } catch (error) {
      console.error('Error saving visit:', error)
      setSubmitError('Could not save this visit.')
    } finally {
      setIsSavingVisit(false)
    }
  }

  const handleDeleteVisit = async (visit) => {
    if (!isPersistedVisit(visit)) {
      setVisits(visits.filter(v => v.id !== visit.id))
      return
    }

    setIsSavingVisit(true)
    setSubmitError('')
    setVisitStatusMessage('')

    try {
      await patientService.deleteVisit(visit.id)
      setVisits((current) => current.filter(v => v.id !== visit.id))
      setVisitStatusMessage('Visit deleted.')
    } catch (error) {
      console.error('Error deleting visit:', error)
      setSubmitError('Could not delete this visit.')
    } finally {
      setIsSavingVisit(false)
    }
  }

  const toggleScan = (scanType) => {
    setSelectedScans(prev =>
      prev.includes(scanType)
        ? prev.filter(s => s !== scanType)
        : [...prev, scanType]
    )
  }

  const openScanWorkflow = (scanType = selectedScans[0]) => {
    if (scanType !== 'Fetal Echo') {
      setSubmitError(`${scanType || 'This scan'} workflow is not available yet.`)
      return
    }

    const query = new URLSearchParams()
    if (selectedPatientId) query.set('patientId', selectedPatientId)
    navigate(`/fetal-echo-report${query.toString() ? `?${query.toString()}` : ''}`)
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
  const selectClass = "w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white"
  const labelClass = "block text-xs font-medium text-slate-700 mb-1.5"

  const handleAddNew = (field) => {
    setAddingField(field)
    setNewValue('')
    setOptionError('')
  }

  const handleSaveNew = async (field) => {
    const trimmedValue = newValue.trim()
    if (!trimmedValue) return

    try {
      const result = await lookupOptionService.createLookupOption(field, trimmedValue)
      const savedValue = result.data?.value || trimmedValue

      setLookupOptions((current) => ({
        ...current,
        [field]: withCurrentValue(current[field] || [], savedValue),
      }))
      setFormData((current) => ({ ...current, [field]: savedValue }))
      setAddingField(null)
      setNewValue('')
      setOptionError('')
    } catch (error) {
      console.error('Error saving lookup option:', error)
      setOptionError('Could not save the new dropdown value.')
    }
  }

  const handleCancelAdd = () => {
    setAddingField(null)
    setNewValue('')
  }

  if (isLoadingPatient) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500">
        Loading patient data...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-2 lg:p-3">
      <div className="w-full">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Main Form - Takes 3 columns */}
            <div className="xl:col-span-3 space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" />
                    Basic Information
                  </h2>
                </div>
                <div className="p-3">
                  {usesExistingPatient && (
                    <div className="mb-4 rounded-lg border border-teal-100 bg-teal-50/60 p-3">
                      <label className={labelClass}>Select Patient</label>
                      <select
                        className={selectClass}
                        value={selectedPatientId}
                        onChange={(e) => handlePatientSelect(e.target.value)}
                        disabled={isLoadingPatients}
                      >
                        <option value="">
                          {isLoadingPatients ? 'Loading patients...' : '-- Select Patient --'}
                        </option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.patient_id} - {patient.first_name} {patient.last_name}
                          </option>
                        ))}
                      </select>
                      {patientSelectError && (
                        <p className="mt-2 text-sm font-medium text-red-700">{patientSelectError}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className={labelClass}>Patient ID *</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.patient_id}
                        onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                        required
                        placeholder="e.g., MD0012026"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Salutation</label>
                      <div className="flex gap-1">
                        <select
                          className={selectClass}
                          value={formData.salutation}
                          onChange={(e) => setFormData({...formData, salutation: e.target.value})}
                        >
                          <option value="">Select</option>
                          {withCurrentValue(lookupOptions.salutation || [], formData.salutation).map(sal => (
                            <option key={sal} value={sal}>{sal}</option>
                          ))}
                        </select>
                        {addingField === 'salutation' ? (
                          <input
                            type="text"
                            className="w-24 px-2 py-1 text-sm border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="New"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveNew('salutation')
                              } else if (e.key === 'Escape') {
                                handleCancelAdd()
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddNew('salutation')}
                            className="px-2 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded transition"
                            title="Add new"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>First Name *</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Last Name (Father/Spouse)</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Middle Name</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.middle_name}
                        onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Age</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: e.target.value})}
                          placeholder="Age"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Years</label>
                        <select className={inputClass}>
                          <option>Years</option>
                          <option>Months</option>
                          <option>Days</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Date of Birth</label>
                      <div className="relative">
                        <input
                          type="date"
                          className={`${inputClass} pr-10`}
                          value={formData.dob}
                          onChange={(e) => handleDobChange(e.target.value)}
                          onInput={(e) => handleDobChange(e.target.value)}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Gender</label>
                      <div className="flex items-center gap-3 mt-2">
                        {['M', 'F', 'UA'].map(g => (
                          <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value={g}
                              checked={formData.gender === g}
                              onChange={(e) => setFormData({...formData, gender: e.target.value})}
                              className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-sm text-slate-700">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Marital Status</label>
                      <div className="flex gap-1">
                        <select
                          className={selectClass}
                          value={formData.marital_status}
                          onChange={(e) => setFormData({...formData, marital_status: e.target.value})}
                        >
                          <option value="">Select</option>
                          {withCurrentValue(lookupOptions.marital_status || [], formData.marital_status).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        {addingField === 'marital_status' ? (
                          <input
                            type="text"
                            className="w-24 px-2 py-1 text-sm border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="New"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveNew('marital_status')
                              } else if (e.key === 'Escape') {
                                handleCancelAdd()
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddNew('marital_status')}
                            className="px-2 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded transition"
                            title="Add new"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Ethnic Origin</label>
                      <div className="flex gap-1">
                        <select
                          className={selectClass}
                          value={formData.ethnic_origin}
                          onChange={(e) => setFormData({...formData, ethnic_origin: e.target.value})}
                        >
                          <option value="">Select</option>
                          {withCurrentValue(lookupOptions.ethnic_origin || [], formData.ethnic_origin).map(origin => (
                            <option key={origin} value={origin}>{origin}</option>
                          ))}
                        </select>
                        {addingField === 'ethnic_origin' ? (
                          <input
                            type="text"
                            className="w-24 px-2 py-1 text-sm border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="New"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveNew('ethnic_origin')
                              } else if (e.key === 'Escape') {
                                handleCancelAdd()
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddNew('ethnic_origin')}
                            className="px-2 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded transition"
                            title="Add new"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Address Information
                  </h2>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <label className={labelClass}>Street Address</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.street}
                        onChange={(e) => setFormData({...formData, street: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Taluk</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.taluk}
                        onChange={(e) => setFormData({...formData, taluk: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Area</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.area}
                        onChange={(e) => setFormData({...formData, area: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Area (P.O.)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className={inputClass}
                          value={formData.area_po}
                          onChange={(e) => setFormData({...formData, area_po: e.target.value})}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm whitespace-nowrap"
                        >
                          Add / Modify
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Zip Code</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.zip_code}
                        onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Country</label>
                      <div className="flex gap-1">
                        <select
                          className={selectClass}
                          value={formData.country}
                          onChange={(e) => setFormData({...formData, country: e.target.value})}
                        >
                          <option value="">Select</option>
                          {withCurrentValue(lookupOptions.country || [], formData.country).map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                        {addingField === 'country' ? (
                          <input
                            type="text"
                            className="w-24 px-2 py-1 text-sm border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="New"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveNew('country')
                              } else if (e.key === 'Escape') {
                                handleCancelAdd()
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddNew('country')}
                            className="px-2 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded transition"
                            title="Add new"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>State</label>
                      <div className="flex gap-1">
                        <select
                          className={selectClass}
                          value={formData.state}
                          onChange={(e) => setFormData({...formData, state: e.target.value})}
                        >
                          <option value="">Select</option>
                          {withCurrentValue(lookupOptions.state || [], formData.state).map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                        {addingField === 'state' ? (
                          <input
                            type="text"
                            className="w-24 px-2 py-1 text-sm border border-teal-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="New"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveNew('state')
                              } else if (e.key === 'Escape') {
                                handleCancelAdd()
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddNew('state')}
                            className="px-2 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded transition"
                            title="Add new"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>District/City</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className={inputClass}
                          value={formData.district_city}
                          onChange={(e) => setFormData({...formData, district_city: e.target.value})}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-600" />
                    Contact Information
                  </h2>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Phone #1</label>
                      <input
                        type="tel"
                        className={inputClass}
                        value={formData.phone1}
                        onChange={(e) => setFormData({...formData, phone1: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Phone #2</label>
                      <input
                        type="tel"
                        className={inputClass}
                        value={formData.phone2}
                        onChange={(e) => setFormData({...formData, phone2: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Mobile #</label>
                      <input
                        type="tel"
                        className={inputClass}
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Fax #</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.fax}
                        onChange={(e) => setFormData({...formData, fax: e.target.value})}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>Email</label>
                      <div className="relative">
                        <input
                          type="email"
                          className={`${inputClass} pl-10`}
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visits Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Visits
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddVisit}
                    disabled={isSavingVisit || (usesExistingPatient && !selectedPatientId)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {isSavingVisit ? 'Saving...' : 'Add new visit'}
                  </button>
                </div>
                {(visitStatusMessage || (isVisitMode && !selectedPatientId)) && (
                  <div className={`mx-4 mt-3 rounded-md border px-3 py-2 text-sm font-medium ${
                    visitStatusMessage
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}>
                    {visitStatusMessage || 'Select a patient before adding visits.'}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Visit Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Referral Doctor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Image</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">AVI</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Preg.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">OB</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {visits.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                            {usesExistingPatient && !selectedPatientId
                              ? 'Select a patient to view or add visits.'
                              : 'No visits recorded. Click "Add new visit" to create one.'}
                          </td>
                        </tr>
                      ) : (
                        visits.map((visit, index) => (
                          <tr key={visit.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-900">{index + 1}</td>
                            <td className="px-4 py-3">
                              <input
                                type="datetime-local"
                                className="input text-sm"
                                value={(visit.visit_date || '').slice(0, 16)}
                                onChange={(e) => handleUpdateVisit(visit.id, 'visit_date', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm"
                                value={visit.referral_doctor ?? ''}
                                onChange={(e) => handleUpdateVisit(visit.id, 'referral_doctor', e.target.value)}
                                placeholder="Self"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm w-20"
                                value={visit.image_count ?? '0'}
                                onChange={(e) => handleUpdateVisit(visit.id, 'image_count', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm w-20"
                                value={visit.avi ?? '0'}
                                onChange={(e) => handleUpdateVisit(visit.id, 'avi', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm w-20"
                                value={visit.pregnancy ?? '0'}
                                onChange={(e) => handleUpdateVisit(visit.id, 'pregnancy', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm w-20"
                                value={visit.ob ?? ''}
                                onChange={(e) => handleUpdateVisit(visit.id, 'ob', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleSaveVisit(visit)}
                                disabled={isSavingVisit || (usesExistingPatient && !selectedPatientId)}
                                className="mr-3 text-teal-700 transition hover:text-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Save visit"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVisit(visit)}
                                disabled={isSavingVisit}
                                className="text-red-600 hover:text-red-800 transition disabled:cursor-not-allowed disabled:opacity-50"
                                title="Delete visit"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Takes 1 column */}
            <div className="space-y-4">
              {/* Scans Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-white">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-600" />
                    List of Scans
                  </h2>
                </div>
                <div className="p-3 space-y-2">
                  {scanTypes.map(scanType => (
                    <label
                      key={scanType}
                      onDoubleClick={() => openScanWorkflow(scanType)}
                      title={scanType === 'Fetal Echo' ? 'Double-click to open fetal echo report' : undefined}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 cursor-pointer transition group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScans.includes(scanType)}
                        onChange={() => toggleScan(scanType)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-teal-700">{scanType}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleAddVisit}
                  disabled={isSavingVisit || (usesExistingPatient && !selectedPatientId)}
                  className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {isSavingVisit ? 'Saving...' : 'Add New Visit'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsReferralDoctorOpen(true)}
                  className="w-full px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition flex items-center justify-center gap-2 font-medium"
                >
                  <User className="w-4 h-4" />
                  New Referral Doctor
                </button>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => openScanWorkflow(selectedScans.includes('Fetal Echo') ? 'Fetal Echo' : selectedScans[0])}
                    className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium shadow-sm"
                  >
                    <Activity className="w-4 h-4" />
                    Go to Scan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="mt-3 bg-white rounded-lg shadow-sm border border-slate-200 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-2 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
              <div className="flex items-center gap-2">
                {(submitError || optionError) && (
                  <div className="mr-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {submitError || optionError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition flex items-center gap-2 text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  Preview
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : saveLabel}
                </button>
              </div>
            </div>
          </div>
      </div>

      {isReferralDoctorOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-3 py-6">
          <div className="w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-300 bg-[#b5cbe1] px-4 py-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-700" />
                <h2 className="text-base font-semibold text-slate-900">Referral Doctor</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsReferralDoctorOpen(false)}
                className="rounded-md p-1 text-slate-600 transition hover:bg-white/70 hover:text-slate-950"
                aria-label="Close referral doctor popup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4">
              <ReferralDoctorForm
                onCancel={() => setIsReferralDoctorOpen(false)}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </form>
  )
}

export default NewPatient
