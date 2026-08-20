import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { patientService } from '../api/patientService'
import AddableSelect from '../components/AddableSelect'
import ReferralDoctorModal from '../components/ReferralDoctorModal'
import ConfiguredFields from '../components/ConfiguredFields'
import PatientDocumentUpload from '../components/PatientDocumentUpload'
import { workspaceService } from '../api/workspaceService'
import { referralDoctorService } from '../api/referralDoctorService'
import {
  getStatesForCountry,
  getCitiesForState,
  getDialCode,
  lookupPincode,
  calculateAgeDetails,
  COUNTRY_DIAL_CODES,
  postalCodeLength,
  phoneNumberLength,
} from '../data/locationData'

function NewPatient() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
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
    custom_fields: {},
  })

  const [visits, setVisits] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const [referralDoctors, setReferralDoctors] = useState([])
  const [activeReferralVisitId, setActiveReferralVisitId] = useState(null)
  const [zipLookupStatus, setZipLookupStatus] = useState('')

  const countries = Object.keys(COUNTRY_DIAL_CODES)
  const availableStates = getStatesForCountry(formData.country)
  const availableCities = getCitiesForState(formData.state)
  const ethnicOrigins = ['Indian', 'Asian', 'African', 'European', 'Other']
  const salutations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Baby', 'Master']
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed']

  useEffect(() => {
    workspaceService.getNextPatientId().then((result) => {
      if (result.data?.patient_id) setFormData((c) => c.patient_id ? c : { ...c, patient_id: result.data.patient_id })
    }).catch(() => {})
  }, [])

  useEffect(() => { referralDoctorService.getReferralDoctors().then((result) => setReferralDoctors(result.data || [])).catch(() => setReferralDoctors([])) }, [])

  const handleDobChange = useCallback((dob) => {
    const details = calculateAgeDetails(dob)
    setFormData(prev => ({ ...prev, dob, age: details.years }))
  }, [])

  const handleCountryChange = useCallback((country) => {
    setFormData(prev => ({ ...prev, country, state: '', district_city: '', mobile: '' }))
    setZipLookupStatus('')
  }, [])

  const handleStateChange = useCallback((state) => {
    setFormData(prev => ({ ...prev, state, district_city: '' }))
  }, [])

  const handleZipChange = useCallback((zip) => {
    setFormData(prev => ({ ...prev, zip_code: zip }))
    if (zip.trim().length === 6 && formData.country === 'India') {
      const info = lookupPincode(zip.trim())
      if (info) {
        setFormData(prev => ({ ...prev, zip_code: zip, taluk: info.taluk, area_po: info.post, district_city: info.district || prev.district_city }))
        setZipLookupStatus('found')
      } else { setZipLookupStatus('notfound') }
    } else { setZipLookupStatus('') }
  }, [formData.country])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const patientResult = await patientService.createPatient(formData)
      const patient = patientResult.data
      const createdVisits = []
      for (const visit of visits.filter((item) => item.visit_date)) {
        const { id, ...visitPayload } = visit
        const result = await patientService.addVisit(patient.id, visitPayload)
        createdVisits.push(result.data)
      }
      navigate(`/patients/${patient.id}/records`)
    } catch (error) {
      console.error('Error creating patient:', error)
      setSubmitError(error.response?.data?.detail || 'Unable to create the patient. Please check the required fields and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddVisit = () => {
    setVisits([...visits, { id: Date.now(), visit_date: '', referral_doctor: '', image_count: '0', avi: '0', pregnancy: '0', ob: '' }])
  }
  const handleUpdateVisit = (id, field, value) => setVisits(visits.map(v => v.id === id ? { ...v, [field]: value } : v))
  const handleDeleteVisit = (id) => setVisits(visits.filter(v => v.id !== id))
  const referralDoctorLabel = (doctor) => doctor.doctor_type === 'hospital' ? (doctor.institution_name || doctor.name || 'Hospital') : `${doctor.salutation || ''} ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || doctor.name || 'Referral doctor'

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
  const selectClass = "w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white"
  const labelClass = "block text-xs font-medium text-slate-700 mb-1.5"
  const dialCode = getDialCode(formData.country)
  const ageDetails = calculateAgeDetails(formData.dob)
  const zipLength = postalCodeLength(formData.country)
  const phoneLength = phoneNumberLength(formData.country)

  return (
    <>
      <form onSubmit={handleSubmit} className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-2 lg:p-3">
        <div className="w-full">
          <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" /> Basic Information
                  </h2>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className={labelClass}>Patient ID *</label>
                      <input type="text" className={inputClass} value={formData.patient_id} onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })} required placeholder="e.g., TM0012026" />
                    </div>
                    <div>
                      <label className={labelClass}>Salutation</label>
                      <AddableSelect field="patient_salutation" className={selectClass} options={salutations} value={formData.salutation} onChange={(value) => setFormData({ ...formData, salutation: value })} />
                    </div>
                    <div>
                      <label className={labelClass}>First Name *</label>
                      <input type="text" className={inputClass} value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                    </div>
                    <div>
                      <label className={labelClass}>Parent / Spouse Name</label>
                      <input type="text" className={inputClass} value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Middle Name</label>
                      <input type="text" className={inputClass} value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Date of Birth *</label>
                      <div className="relative">
                        <input required type="date" className={`${inputClass} pr-10`} value={formData.dob} onChange={(e) => handleDobChange(e.target.value)} />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Age</label>
                      <output className={`${inputClass} block bg-slate-50 text-slate-700`}>{ageDetails.label || 'Calculated from date of birth'}</output>
                    </div>
                    <div>
                      <label className={labelClass}>Gender</label>
                      <div className="flex items-center gap-3 mt-2">
                        {['M', 'F', 'UA'].map(g => (
                          <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-4 h-4 text-teal-600 focus:ring-teal-500" />
                            <span className="text-sm text-slate-700">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Marital Status</label>
                      <AddableSelect field="patient_marital_status" className={selectClass} options={maritalStatuses} value={formData.marital_status} onChange={(value) => setFormData({ ...formData, marital_status: value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Ethnic Origin</label>
                      <AddableSelect field="patient_ethnic_origin" className={selectClass} options={ethnicOrigins} value={formData.ethnic_origin} onChange={(value) => setFormData({ ...formData, ethnic_origin: value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" /> Address Information
                  </h2>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <label className={labelClass}>Street Address</label>
                      <input type="text" className={inputClass} value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Taluk</label>
                      <input type="text" className={inputClass} value={formData.taluk} onChange={(e) => setFormData({ ...formData, taluk: e.target.value })} placeholder="Auto-filled by zip code" />
                    </div>
                    <div>
                      <label className={labelClass}>Area</label>
                      <input type="text" className={inputClass} value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Area (P.O.)</label>
                      <div className="flex gap-2">
                        <input type="text" className={inputClass} value={formData.area_po} onChange={(e) => setFormData({ ...formData, area_po: e.target.value })} placeholder="Auto-filled by zip code" />
                        <button type="button" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm whitespace-nowrap">Add / Modify</button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Zip Code</label>
                      <input type="text" inputMode="numeric" className={inputClass} value={formData.zip_code} onChange={(e) => handleZipChange(e.target.value.replace(/\D/g, '').slice(0, zipLength))} maxLength={zipLength} placeholder={`Enter ${zipLength}-digit postal code`} />
                      {zipLookupStatus === 'found' && <p className="mt-1 text-xs text-teal-600 font-medium">✓ Taluk &amp; Post auto-filled</p>}
                      {zipLookupStatus === 'notfound' && <p className="mt-1 text-xs text-amber-500 font-medium">Pincode not in database — fill manually</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <AddableSelect field="patient_country" className={selectClass} options={countries} value={formData.country} onChange={handleCountryChange} />
                      {dialCode && <p className="mt-1 text-xs text-slate-500">Dial code: <span className="font-semibold text-slate-700">{dialCode}</span></p>}
                    </div>
                    <div>
                      <label className={labelClass}>State</label>
                      <AddableSelect field="patient_state" className={selectClass} options={availableStates} value={formData.state} onChange={handleStateChange} />
                    </div>
                    <div>
                      <label className={labelClass}>District/City</label>
                      <AddableSelect field="patient_district_city" className={selectClass} options={availableCities} value={formData.district_city} onChange={(value) => setFormData({ ...formData, district_city: value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-600" /> Contact Information
                  </h2>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Phone #1</label>
                      <input type="tel" inputMode="numeric" maxLength={phoneLength} className={inputClass} value={formData.phone1} onChange={(e) => setFormData({ ...formData, phone1: e.target.value.replace(/\D/g, '').slice(0, phoneLength) })} placeholder={`${phoneLength}-digit phone number`} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone #2</label>
                      <input type="tel" inputMode="numeric" maxLength={phoneLength} className={inputClass} value={formData.phone2} onChange={(e) => setFormData({ ...formData, phone2: e.target.value.replace(/\D/g, '').slice(0, phoneLength) })} placeholder={`${phoneLength}-digit phone number`} />
                    </div>
                    <div>
                      <label className={labelClass}>Mobile #</label>
                      <div className="flex gap-1">
                        {dialCode && <span className="flex items-center px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 whitespace-nowrap select-none">{dialCode}</span>}
                        <input type="tel" inputMode="numeric" maxLength={phoneLength} className={`${inputClass} flex-1`} value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, phoneLength) })} placeholder={`${phoneLength}-digit mobile number`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Fax #</label>
                      <input type="text" className={inputClass} value={formData.fax} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Email</label>
                      <div className="relative">
                        <input type="email" className={`${inputClass} pl-10`} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
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
                    <Calendar className="w-4 h-4 text-teal-600" /> Visits
                  </h2>
                  <button type="button" onClick={handleAddVisit} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium">
                    <Plus className="w-4 h-4" /> Add new visit
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        {['No.', 'Visit Date', 'Referral Doctor', 'Image', 'AVI', 'GA / Weeks', 'Obs / Scan', 'Action'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase${h === 'Action' ? ' text-center' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {visits.length === 0 ? (
                        <tr><td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">No visits recorded. Click &quot;Add new visit&quot; to create one.</td></tr>
                      ) : visits.map((visit, index) => (
                        <tr key={visit.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-900">{index + 1}</td>
                          <td className="px-4 py-3"><input type="datetime-local" className="input text-sm" value={visit.visit_date?.slice(0, 16)} onChange={(e) => handleUpdateVisit(visit.id, 'visit_date', e.target.value)} /></td>
                          <td className="px-4 py-3"><div className="flex min-w-52 gap-1"><select className="input text-sm" value={visit.referral_doctor} onChange={(e) => handleUpdateVisit(visit.id, 'referral_doctor', e.target.value)}><option value="">Select referral doctor</option>{referralDoctors.map((doctor) => { const label = referralDoctorLabel(doctor); return <option key={doctor.id} value={label}>{label}</option> })}</select><button type="button" onClick={() => { setActiveReferralVisitId(visit.id); setIsReferralModalOpen(true) }} className="rounded border border-teal-300 px-2 text-lg font-bold text-teal-700 hover:bg-teal-50" title="Add referral doctor">+</button></div></td>
                          <td className="px-4 py-3"><input type="text" className="input text-sm w-20" value={visit.image_count} onChange={(e) => handleUpdateVisit(visit.id, 'image_count', e.target.value)} /></td>
                          <td className="px-4 py-3"><input type="text" className="input text-sm w-20" value={visit.avi} onChange={(e) => handleUpdateVisit(visit.id, 'avi', e.target.value)} /></td>
                          <td className="px-4 py-3"><input type="text" className="input text-sm w-20" value={visit.pregnancy} onChange={(e) => handleUpdateVisit(visit.id, 'pregnancy', e.target.value)} /></td>
                          <td className="px-4 py-3"><input type="text" className="input text-sm w-20" value={visit.ob} onChange={(e) => handleUpdateVisit(visit.id, 'ob', e.target.value)} /></td>
                          <td className="px-4 py-3 text-center">
                            <button type="button" onClick={() => handleDeleteVisit(visit.id)} className="text-red-600 hover:text-red-800 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <PatientDocumentUpload customFields={formData.custom_fields} onChange={(custom_fields) => setFormData({ ...formData, custom_fields })} />
              <ConfiguredFields module="Patients" values={formData.custom_fields} onChange={(custom_fields) => setFormData({ ...formData, custom_fields })} />
          </div>

          {/* Bottom Action Buttons */}
          <div className="mt-3 bg-white rounded-lg shadow-sm border border-slate-200 p-2">
            {submitError && (
              <p role="alert" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">{submitError}</p>
            )}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition flex items-center gap-2 text-sm font-medium">
                  <Printer className="w-4 h-4" /> Preview
                </button>
                <button type="button" onClick={() => navigate('/search')} className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 flex items-center gap-2 text-sm font-medium"><X className="w-4 h-4" /> Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Patient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      <ReferralDoctorModal
        open={isReferralModalOpen}
        onClose={() => { setIsReferralModalOpen(false); setActiveReferralVisitId(null) }}
        onSelect={(record) => {
          const doctor = referralDoctorLabel(record)
          if (activeReferralVisitId) {
            handleUpdateVisit(activeReferralVisitId, 'referral_doctor', doctor)
            setActiveReferralVisitId(null)
          } else {
            setFormData((current) => ({ ...current, family_doctor: doctor }))
          }
          referralDoctorService.getReferralDoctors().then((result) => setReferralDoctors(result.data || [])).catch(() => {})
        }}
      />
    </>
  )
}

export default NewPatient
