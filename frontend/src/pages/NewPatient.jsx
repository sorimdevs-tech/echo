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
  Activity,
  Building,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'
import AddableSelect from '../components/AddableSelect'
import ReferralDoctorModal from '../components/ReferralDoctorModal'
import { workspaceService } from '../api/workspaceService'
import {
  getStatesForCountry,
  getCitiesForState,
  getDialCode,
  lookupPincode,
  calculateAge,
  calculateAgeWithUnit,
  calculateAgeForUnit,
  COUNTRY_DIAL_CODES,
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
    age_unit: 'Years',
    dob: '',
    gender: 'M',
    marital_status: '',
    ethnic_origin: '',
    street: '',
    zip_code: '',
    country: 'India',
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
  })

  const [visits, setVisits] = useState([])
  const [selectedScans, setSelectedScans] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const [zipLookupStatus, setZipLookupStatus] = useState('')

  const countries = Object.keys(COUNTRY_DIAL_CODES)
  const availableStates = getStatesForCountry(formData.country)
  const availableCities = getCitiesForState(formData.state)
  const ethnicOrigins = ['Indian', 'Asian', 'African', 'European', 'Other']
  const salutations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Baby', 'Master']
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed']


  const handleDobChange = useCallback((dob) => {
    const calculated = calculateAgeWithUnit(dob)
    setFormData(prev => ({
      ...prev,
      dob,
      age: calculated.age,
      age_unit: calculated.unit || prev.age_unit || 'Years'
    }))
  }, [])

  const handleCountryChange = useCallback((country) => {
    const code = getDialCode(country)
    setFormData(prev => ({ ...prev, country, state: '', district_city: '', mobile: code ? code + ' ' : '' }))
    setZipLookupStatus('')
  }, [])

  const handleStateChange = useCallback((state) => {
    setFormData(prev => ({ ...prev, state, district_city: '' }))
  }, [])

  const handleZipChange = useCallback((zip) => {
    setFormData(prev => ({ ...prev, zip_code: zip }))
    if (zip.trim().length === 6) {
      const info = lookupPincode(zip.trim())
      if (info) {
        setFormData(prev => ({ ...prev, zip_code: zip, taluk: info.taluk, area_po: info.post, district_city: info.district || prev.district_city }))
        setZipLookupStatus('found')
      } else { setZipLookupStatus('notfound') }
    } else { setZipLookupStatus('') }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const missing = []
    for (const key of ['patient_id','first_name','last_name','gender','street','state','country','family_doctor']) if (!String(formData[key] || '').trim()) missing.push(key.replace(/_/g, ' '))
    if (!formData.dob && formData.age === '') missing.push('DOB or age')
    if (![formData.phone1,formData.phone2,formData.mobile].some(v => /\d/.test(v))) missing.push('one phone number')
    if (missing.length) { setSubmitError('Required: ' + missing.join(', ')); return }
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const patientResult = await patientService.createPatient(formData)
      const patient = patientResult.data
      navigate(`/visits?patient=${patient.id}`)
    } catch (error) {
      console.error('Error creating patient:', error)
      setSubmitError(error.response?.data?.detail || 'Unable to create the patient. Please check the required fields and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddVisit = () => {
    const now = new Date();
    const formattedDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setVisits([...visits, { id: Date.now(), visit_date: formattedDateTime, referral_doctor: formData.family_doctor || '', image_count: '0', avi: '0', pregnancy: '0', ob: '' }])
  }
  const handleUpdateVisit = (id, field, value) => setVisits(visits.map(v => v.id === id ? { ...v, [field]: value } : v))
  const handleDeleteVisit = (id) => setVisits(visits.filter(v => v.id !== id))
  const toggleScan = (scanType) => setSelectedScans(prev => prev.includes(scanType) ? prev.filter(s => s !== scanType) : [...prev, scanType])

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
  const selectClass = "w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white"
  const labelClass = "block text-xs font-medium text-slate-700 mb-1.5"
  const dialCode = getDialCode(formData.country)

  return (
    <>
      <form onSubmit={handleSubmit} className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-2 lg:p-3">
        <div className="w-full">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Main Form */}
            <div className="xl:col-span-3 space-y-6">
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
                      <label className={labelClass + ' required'}>Patient ID</label>
                      <input type="text" className={inputClass} value={formData.patient_id} onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })} required aria-required="true" placeholder="e.g., TM0012026" />
                    </div>
                    <div>
                      <label className={labelClass}>Salutation</label>
                      <AddableSelect field="patient_salutation" className={selectClass} options={salutations} value={formData.salutation} onChange={(value) => setFormData({ ...formData, salutation: value })} />
                    </div>
                    <div>
                      <label className={labelClass + ' required'}>First Name</label>
                      <input type="text" className={inputClass} value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required aria-required="true" />
                    </div>
                    <div>
                      <label className={labelClass + ' required'}>Surname / Initial</label>
                      <input type="text" className={inputClass} value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required aria-required="true" />
                    </div>
                    <div>
                      <label className={labelClass}>Middle Name</label>
                      <input type="text" className={inputClass} value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass + ' required'}>Date of Birth (or age)</label>
                      <div className="relative">
                        <input type="date" className={`${inputClass} pr-10`} value={formData.dob} onChange={(e) => handleDobChange(e.target.value)} aria-required="true" />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      {formData.dob && formData.age && (
                        <p className="mt-1 text-xs text-teal-600 font-medium">
                          Age: {formData.age} {formData.age_unit || 'Years'}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass + ' required'}>Age (or DOB)</label>
                        <input type="number" className={inputClass} value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Age" aria-required="true" onWheel={(e) => e.currentTarget.blur()} />
                      </div>
                      <div>
                        <label className={labelClass}>Unit</label>
                        <select
                          className={selectClass}
                          value={formData.age_unit || 'Years'}
                          onChange={(e) => {
                            const newUnit = e.target.value;
                            const newAge = formData.dob ? calculateAgeForUnit(formData.dob, newUnit) : formData.age;
                            setFormData({ ...formData, age_unit: newUnit, age: newAge });
                          }}
                        >
                          <option value="Years">Years</option>
                          <option value="Months">Months</option>
                          <option value="Days">Days</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass + ' required'}>Gender</label>
                      <div className="flex items-center gap-3 mt-2">
                        {['M', 'F', 'UA'].map(g => (
                          <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-4 h-4 text-teal-600 focus:ring-teal-500" required aria-required="true" />
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
                      <label className={labelClass + ' required'}>Street Address</label>
                      <input type="text" className={inputClass} value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required aria-required="true" />
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
                      <input type="text" className={inputClass} value={formData.zip_code} onChange={(e) => handleZipChange(e.target.value)} maxLength={10} placeholder="Enter zip / pincode" />
                      {zipLookupStatus === 'found' && <p className="mt-1 text-xs text-teal-600 font-medium">✓ Taluk &amp; Post auto-filled</p>}
                      {zipLookupStatus === 'notfound' && <p className="mt-1 text-xs text-amber-500 font-medium">Pincode not in database — fill manually</p>}
                    </div>
                    <div>
                      <label className={labelClass + ' required'}>Country</label>
                      <AddableSelect field="patient_country" className={selectClass} options={countries} value={formData.country} onChange={handleCountryChange} required aria-required="true" />
                      {dialCode && <p className="mt-1 text-xs text-slate-500">Dial code: <span className="font-semibold text-slate-700">{dialCode}</span></p>}
                    </div>
                    <div>
                      <label className={labelClass + ' required'}>State</label>
                      <AddableSelect field="patient_state" className={selectClass} options={availableStates} value={formData.state} onChange={handleStateChange} required aria-required="true" />
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
                      <label className={labelClass + ' required'}>Phone (at least one required)</label>
                      <input type="tel" className={inputClass} value={formData.phone1} onChange={(e) => setFormData({ ...formData, phone1: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone 2</label>
                      <input type="tel" className={inputClass} value={formData.phone2} onChange={(e) => setFormData({ ...formData, phone2: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Mobile</label>
                      <div className="flex gap-1">
                        {dialCode && <span className="flex items-center px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 whitespace-nowrap select-none">{dialCode}</span>}
                        <input type="tel" className={`${inputClass} flex-1`} value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} placeholder="Mobile number" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Fax</label>
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

              {/* Additional Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-600" /> Additional Information
                  </h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Aadhaar No</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.aadhaar_no}
                        onChange={(e) => setFormData({ ...formData, aadhaar_no: e.target.value })}
                        placeholder="XXXX XXXX XXXX"
                      />
                    </div>
                    <div>
                      <label className={labelClass + ' required'}>Referral Doctor / Institute</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className={inputClass}
                          value={formData.family_doctor}
                          onChange={(e) => setFormData({ ...formData, family_doctor: e.target.value })}
                          list="referral-options" placeholder="Doctor, institute or Self"
                          required aria-required="true"
                        />
                        <datalist id="referral-options"><option value="Self" /></datalist>
                        <button
                          type="button"
                          onClick={() => setIsReferralModalOpen(true)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-xs font-semibold whitespace-nowrap"
                        >
                          Select Doctor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <aside className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Patient registration</h2><p className="mt-2 text-sm">Save the patient first. Add a visit and select the examination on the patient visit page after attendance.</p></aside>
          </div>
          {/* Bottom Action Buttons */}
          <div className="mt-3 bg-white rounded-lg shadow-sm border border-slate-200 p-2">
            {submitError && (
              <p role="alert" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">{submitError}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate('/search')} className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-2 text-sm font-medium">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition flex items-center gap-2 text-sm font-medium">
                  <Printer className="w-4 h-4" /> Preview
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  title="Save patient and open visits"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Patient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      <ReferralDoctorModal
        open={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        onSelect={(record) => setFormData({ ...formData, family_doctor: record.doctor_type === 'hospital' ? record.institution_name : `${record.first_name || ''} ${record.last_name || ''}`.trim() })}
      />
    </>
  )
}

export default NewPatient
