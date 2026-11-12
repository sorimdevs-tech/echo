import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Printer,
  Activity,
  Building,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { referralDoctorService } from '../api/referralDoctorService'
import AddableSelect from '../components/AddableSelect'
import ReferralDoctorModal from '../components/ReferralDoctorModal'
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
    gender: '',
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
    referral_doctor: '',
    referral_institute: '',
    referral_source: '',
    audit_done: 'No',
    report_done: 'No',
    taluk: '',
    area: '',
    area_po: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [patientIdCheck, setPatientIdCheck] = useState('')
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const [zipLookupStatus, setZipLookupStatus] = useState('')
  const [referralDoctors, setReferralDoctors] = useState([])

  const loadReferralDoctors = useCallback(() => {
    referralDoctorService.getReferralDoctors()
      .then((result) => setReferralDoctors(result.data || []))
      .catch(() => setReferralDoctors([]))
  }, [])

  useEffect(() => { loadReferralDoctors() }, [loadReferralDoctors])

  const referralOptions = useMemo(() => {
    const options = [{ value: 'Self', label: 'Self' }]
    for (const doctor of referralDoctors) {
      const name = doctor.doctor_type === 'hospital'
        ? (doctor.institution_name || doctor.hospital_name || '')
        : `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()
      if (name && !options.some((option) => option.value === name)) options.push({ value: name, label: name })
    }
    if (formData.family_doctor && !options.some((option) => option.value === formData.family_doctor)) {
      options.push({ value: formData.family_doctor, label: formData.family_doctor })
    }
    return options
  }, [referralDoctors, formData.family_doctor])

  useEffect(() => {
    const value = String(formData.patient_id || '').trim()
    if (!value) { setPatientIdCheck(''); return }
    let active = true
    const timer = setTimeout(() => {
      patientService.getPatients().then(result => {
        if (!active) return
        const duplicate = (result.data || []).some(patient => String(patient.patient_id || '').trim().toLowerCase() === value.toLowerCase())
        setPatientIdCheck(duplicate ? 'This Patient ID already exists. Enter a unique ID.' : 'Patient ID is available.')
      }).catch(() => { if (active) setPatientIdCheck('Unable to check this ID now. It will be checked again when saved.') })
    }, 300)
    return () => { active = false; clearTimeout(timer) }
  }, [formData.patient_id])

  const selectReferral = (name) => {
    if (name === 'Self') {
      setFormData((current) => ({ ...current, family_doctor: 'Self', referral_doctor: 'Self', referral_institute: 'Self', referral_source: 'Self' }))
      return
    }
    const record = referralDoctors.find((doctor) => (doctor.doctor_type === 'hospital'
      ? (doctor.institution_name || doctor.hospital_name || '')
      : `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()) === name)
    const institute = record?.doctor_type === 'hospital'
      ? name
      : record?.parent_institution || record?.institution_name || record?.hospital_name || ''
    setFormData((current) => ({ ...current, family_doctor: name, referral_doctor: name, referral_institute: institute, referral_source: 'Referral centre / institute' }))
  }

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
    setFormData(prev => ({ ...prev, country, state: '', district_city: '', mobile: '' }))
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
    for (const key of ['patient_id','first_name','last_name','gender','street','country','state']) if (!String(formData[key] || '').trim()) missing.push(key.replace(/_/g, ' '))
    if (!formData.dob && formData.age === '') missing.push('DOB or age')
    if (![formData.phone1, formData.phone2, formData.mobile].some(phone => /\d/.test(phone))) missing.push('one phone number')
    if (!formData.referral_doctor && !formData.referral_institute && !formData.family_doctor) missing.push('referral doctor or institute')
    if (patientIdCheck.includes('already exists')) { setSubmitError(patientIdCheck); return }
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

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
  const selectClass = "w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white"
  const labelClass = "block text-xs font-medium text-slate-700 mb-1.5"
  const dialCode = getDialCode(formData.country)

  return (
    <>
      <form onSubmit={handleSubmit} className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-2 lg:p-3">
        <div className="w-full">
          <div className="space-y-6">
            {/* Main Form */}
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
                      <label htmlFor="newpatient-patient_id" className={labelClass + ' required'}>Patient ID<span aria-hidden="true" className="text-red-600"> *</span></label>
                      <input id="newpatient-patient_id" type="text" className={inputClass} value={formData.patient_id} aria-invalid={patientIdCheck.includes("already exists")} onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })} required aria-required="true" placeholder="e.g., TM0012026" />{patientIdCheck && <p role="status" className={`mt-1 text-xs ${patientIdCheck.includes("already exists") ? "text-red-700" : "text-slate-500"}`}>{patientIdCheck}</p>}
                    </div>
                    <div>
                      <label htmlFor="newpatient-salutation" className={labelClass}>Salutation</label>
                      <AddableSelect id="newpatient-salutation" field="patient_salutation" className={selectClass} options={salutations} value={formData.salutation} onChange={(value) => setFormData({ ...formData, salutation: value })} />
                    </div>
                    <div>
                      <label htmlFor="newpatient-first_name" className={labelClass + ' required'}>First Name<span aria-hidden="true" className="text-red-600"> *</span></label>
                      <input id="newpatient-first_name" type="text" className={inputClass} value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required aria-required="true" />
                    </div>
                    <div>
                      <label htmlFor="newpatient-last_name" className={labelClass + ' required'}>Surname / Initial<span aria-hidden="true" className="text-red-600"> *</span></label>
                      <input id="newpatient-last_name" type="text" className={inputClass} value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required aria-required="true" />
                    </div>
                    <div>
                      <label htmlFor="newpatient-middle_name" className={labelClass}>Middle Name</label>
                      <input id="newpatient-middle_name" type="text" className={inputClass} value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="newpatient-dob" className={labelClass + ' required'}>Date of Birth (or age)<span aria-hidden="true" className="text-red-600"> *</span></label>
                      <div className="relative">
                        <input id="newpatient-dob" type="date" className={`${inputClass} pr-10`} value={formData.dob} onChange={(e) => handleDobChange(e.target.value)} aria-required="true" required={!formData.age} />
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
                        <label htmlFor="newpatient-age" className={labelClass + ' required'}>Age (or DOB)<span aria-hidden="true" className="text-red-600"> *</span></label>
                        <input id="newpatient-age" type="number" min="0" className={inputClass} value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Age" aria-required="true" required={!formData.dob} onWheel={(e) => e.currentTarget.blur()} />
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
                      <label className={labelClass + ' required'}>Gender<span aria-hidden="true" className="text-red-600"> *</span></label>
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
                      <label htmlFor="newpatient-marital_status" className={labelClass}>Marital Status</label>
                      <AddableSelect id="newpatient-marital_status" field="patient_marital_status" className={selectClass} options={maritalStatuses} value={formData.marital_status} onChange={(value) => setFormData({ ...formData, marital_status: value })} />
                    </div>
                    <div>
                      <label htmlFor="newpatient-ethnic_origin" className={labelClass}>Ethnic Origin</label>
                      <AddableSelect id="newpatient-ethnic_origin" field="patient_ethnic_origin" className={selectClass} options={ethnicOrigins} value={formData.ethnic_origin} onChange={(value) => setFormData({ ...formData, ethnic_origin: value })} />
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
                      <label htmlFor="newpatient-street" className={labelClass + ' required'}>Street Address<span aria-hidden="true" className="text-red-600"> *</span></label>
                      <input id="newpatient-street" type="text" className={inputClass} value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required aria-required="true" />
                    </div>
                    <div>
                      <label htmlFor="newpatient-taluk" className={labelClass}>Taluk</label>
                      <input id="newpatient-taluk" type="text" className={inputClass} value={formData.taluk} onChange={(e) => setFormData({ ...formData, taluk: e.target.value })} placeholder="Auto-filled by zip code" />
                    </div>
                    <div>
                      <label htmlFor="newpatient-area" className={labelClass}>Area</label>
                      <input id="newpatient-area" type="text" className={inputClass} value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="newpatient-area_po" className={labelClass}>Area (P.O.)</label>
                      <div className="flex gap-2">
                        <input id="newpatient-area_po" type="text" className={inputClass} value={formData.area_po} onChange={(e) => setFormData({ ...formData, area_po: e.target.value })} placeholder="Auto-filled by zip code" />
                        <button type="button" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm whitespace-nowrap">Add / Modify</button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="newpatient-zip_code" className={labelClass}>Zip Code</label>
                      <input id="newpatient-zip_code" type="text" className={inputClass} value={formData.zip_code} onChange={(e) => handleZipChange(e.target.value)} maxLength={10} placeholder="Enter zip / pincode" />
                      {zipLookupStatus === 'found' && <p className="mt-1 text-xs text-teal-600 font-medium">✓ Taluk &amp; Post auto-filled</p>}
                      {zipLookupStatus === 'notfound' && <p className="mt-1 text-xs text-amber-500 font-medium">Pincode not in database — fill manually</p>}
                    </div>
                    <div>
                      <label htmlFor="newpatient-country" className={labelClass + ' required'}>Country<span aria-hidden="true" className="text-red-600"> *</span></label>
                      <AddableSelect id="newpatient-country" field="patient_country" className={selectClass} options={countries} value={formData.country} onChange={handleCountryChange} required aria-required="true" />
                      {dialCode && <p className="mt-1 text-xs text-slate-500">Dial code: <span className="font-semibold text-slate-700">{dialCode}</span></p>}
                    </div>
                    <div>
                      <label htmlFor="newpatient-state" className={labelClass + ' required'}>State<span aria-hidden="true" className="text-red-600"> *</span></label>
                      <AddableSelect id="newpatient-state" field="patient_state" className={selectClass} options={availableStates} value={formData.state} onChange={handleStateChange} required aria-required="true" />
                    </div>
                    <div>
                      <label htmlFor="newpatient-district_city" className={labelClass}>District/City</label>
                      <AddableSelect id="newpatient-district_city" field="patient_district_city" className={selectClass} options={availableCities} value={formData.district_city} onChange={(value) => setFormData({ ...formData, district_city: value })} />
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
                      <label htmlFor="newpatient-phone1" className={labelClass}>Primary Phone (one phone number required)<span aria-hidden="true" className="text-red-600"> *</span></label>
                      <input id="newpatient-phone1" type="tel" className={inputClass} value={formData.phone1} onChange={(e) => setFormData({ ...formData, phone1: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="newpatient-phone2" className={labelClass}>Phone 2</label>
                      <input id="newpatient-phone2" type="tel" className={inputClass} value={formData.phone2} onChange={(e) => setFormData({ ...formData, phone2: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Mobile</label>
                      <div className="flex gap-1">
                        {dialCode && <span className="flex items-center px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 whitespace-nowrap select-none">{dialCode}</span>}
                        <input type="tel" className={`${inputClass} flex-1`} value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} placeholder="Mobile number" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="newpatient-fax" className={labelClass}>Fax</label>
                      <input id="newpatient-fax" type="text" className={inputClass} value={formData.fax} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="newpatient-email" className={labelClass}>Email</label>
                      <div className="relative">
                        <input id="newpatient-email" type="email" className={`${inputClass} pl-10`} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
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
                      <label htmlFor="newpatient-aadhaar_no" className={labelClass}>Aadhaar No</label>
                      <input
                        id="newpatient-aadhaar_no"
                        type="text"
                        className={inputClass}
                        value={formData.aadhaar_no}
                        onChange={(e) => setFormData({ ...formData, aadhaar_no: e.target.value })}
                        placeholder="XXXX XXXX XXXX"
                      />
                    </div>
                    <div>
                      <label htmlFor="newpatient-family_doctor" className={labelClass + ' required'}>Referral Doctor / Institute<span aria-hidden="true" className="text-red-600"> *</span></label>
                      <div className="flex gap-2">
                        <select
                          id="newpatient-family_doctor"
                          className={selectClass}
                          value={formData.family_doctor}
                          onChange={(e) => selectReferral(e.target.value)}
                        >
                          <option value="">Select doctor or institute</option>
                          {referralOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsReferralModalOpen(true)}
                          className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-xs font-semibold whitespace-nowrap"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Doctor
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Audit done</label>
                      <select className={selectClass} value={formData.audit_done} onChange={(event) => setFormData({ ...formData, audit_done: event.target.value })}><option>No</option><option>Yes</option></select>
                    </div>
                    <div>
                      <label className={labelClass}>Report done</label>
                      <select className={selectClass} value={formData.report_done} onChange={(event) => setFormData({ ...formData, report_done: event.target.value })}><option>No</option><option>Yes</option></select>
                    </div>
                  </div>
                </div>
              </div>

            </div>
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
        onSaved={(record) => {
          loadReferralDoctors()
          const name = record.doctor_type === 'hospital'
            ? (record.institution_name || record.hospital_name || '')
            : `${record.salutation || ''} ${record.first_name || ''} ${record.last_name || ''}`.trim()
          if (name) setFormData((current) => ({ ...current, family_doctor: name, referral_doctor: name, referral_institute: record.doctor_type === 'hospital' ? name : (record.parent_institution || record.institution_name || record.hospital_name || ''), referral_source: 'Referral centre / institute' }))
        }}
        onSelect={(record) => {
          loadReferralDoctors()
          const name = record.doctor_type === 'hospital'
            ? (record.institution_name || record.hospital_name || '')
            : `${record.first_name || ''} ${record.last_name || ''}`.trim()
          setFormData((current) => ({ ...current, family_doctor: name || current.family_doctor, referral_doctor: name || current.referral_doctor, referral_institute: record.doctor_type === 'hospital' ? name : (record.parent_institution || record.institution_name || record.hospital_name || current.referral_institute), referral_source: 'Referral centre / institute' }))
        }}
      />
    </>
  )
}

export default NewPatient
