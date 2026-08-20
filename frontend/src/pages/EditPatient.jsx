import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, X } from 'lucide-react'
import { patientService } from '../api/patientService'
import AddableSelect from '../components/AddableSelect'
import ConfiguredFields from '../components/ConfiguredFields'
import PatientDocumentUpload from '../components/PatientDocumentUpload'
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

function EditPatient() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    patient_id: '',
    salutation: 'Mr.',
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
    custom_fields: {},
  })
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [zipLookupStatus, setZipLookupStatus] = useState('')

  const countries = Object.keys(COUNTRY_DIAL_CODES)
  const availableStates = getStatesForCountry(formData.country)
  const availableCities = getCitiesForState(formData.state)
  const dialCode = getDialCode(formData.country)
  const ageDetails = calculateAgeDetails(formData.dob)
  const zipLength = postalCodeLength(formData.country)
  const phoneLength = phoneNumberLength(formData.country)

  useEffect(() => { fetchPatient() }, [id])

  const fetchPatient = async () => {
    try {
      const result = await patientService.getPatient(id)
      if (result.success) { setFormData(result.data) }
    } catch (error) {
      console.error('Error fetching patient:', error)
      alert('Error loading patient data')
      navigate('/patients')
    } finally { setLoading(false) }
  }

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
      await patientService.updatePatient(id, formData)
      navigate('/patients')
    } catch (error) {
      console.error('Error updating patient:', error)
      setSubmitError(error.response?.data?.detail || 'Unable to update the patient. Please check the required fields and try again.')
    } finally { setIsSubmitting(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading patient data...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">Update patient information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Patient ID *</label>
                <input type="text" className="input" value={formData.patient_id} onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })} required />
              </div>
              <div>
                <label className="label">Salutation *</label>
                <AddableSelect field="patient_salutation" className="input" options={['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Baby', 'Master']} value={formData.salutation} onChange={(value) => setFormData({ ...formData, salutation: value })} />
              </div>
              <div>
                <label className="label">First Name *</label>
                <input type="text" className="input" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Parent / Spouse Name</label>
                <input type="text" className="input" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Middle Name</label>
                <input type="text" className="input" value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Date of Birth *</label>
                <input required type="date" className="input" value={formData.dob} onChange={(e) => handleDobChange(e.target.value)} />
              </div>
              <div>
                <label className="label">Age</label>
                <output className="input block bg-slate-50 text-slate-700">{ageDetails.label || 'Calculated from date of birth'}</output>
              </div>
              <div>
                <label className="label">Gender *</label>
                <select className="input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="UA">UA</option>
                </select>
              </div>
              <div>
                <label className="label">Marital Status</label>
                <AddableSelect field="patient_marital_status" className="input" options={['Single', 'Married', 'Divorced', 'Widowed']} value={formData.marital_status} onChange={(value) => setFormData({ ...formData, marital_status: value })} />
              </div>
              <div>
                <label className="label">Ethnic Origin</label>
                <AddableSelect field="patient_ethnic_origin" className="input" options={['Indian', 'Asian', 'African', 'European', 'Other']} value={formData.ethnic_origin} onChange={(value) => setFormData({ ...formData, ethnic_origin: value })} />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="label">Street Address</label>
                <input type="text" className="input" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
              </div>
              <div>
                <label className="label">Taluk</label>
                <input type="text" className="input" value={formData.taluk} onChange={(e) => setFormData({ ...formData, taluk: e.target.value })} placeholder="Auto-filled by zip code" />
              </div>
              <div>
                <label className="label">Area</label>
                <input type="text" className="input" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
              </div>
              <div>
                <label className="label">Area (P.O.)</label>
                <input type="text" className="input" value={formData.area_po} onChange={(e) => setFormData({ ...formData, area_po: e.target.value })} placeholder="Auto-filled by zip code" />
              </div>
              <div>
                <label className="label">Zip Code</label>
                <input type="text" inputMode="numeric" className="input" value={formData.zip_code} onChange={(e) => handleZipChange(e.target.value.replace(/\D/g, '').slice(0, zipLength))} maxLength={zipLength} placeholder={`Enter ${zipLength}-digit postal code`} />
                {zipLookupStatus === 'found' && <p className="mt-1 text-xs text-teal-600 font-medium">Taluk and Post auto-filled</p>}
                {zipLookupStatus === 'notfound' && <p className="mt-1 text-xs text-amber-500 font-medium">Pincode not in database - fill manually</p>}
              </div>
              <div>
                <label className="label">Country</label>
                <AddableSelect field="patient_country" className="input" options={countries} value={formData.country} onChange={handleCountryChange} />
                {dialCode && <p className="mt-1 text-xs text-slate-500">Dial code: <span className="font-semibold text-slate-700">{dialCode}</span></p>}
              </div>
              <div>
                <label className="label">State</label>
                <AddableSelect field="patient_state" className="input" options={availableStates} value={formData.state} onChange={handleStateChange} />
              </div>
              <div>
                <label className="label">District/City</label>
                <AddableSelect field="patient_district_city" className="input" options={availableCities} value={formData.district_city} onChange={(value) => setFormData({ ...formData, district_city: value })} />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Phone #1</label>
                <input type="tel" inputMode="numeric" maxLength={phoneLength} className="input" value={formData.phone1} onChange={(e) => setFormData({ ...formData, phone1: e.target.value.replace(/\D/g, '').slice(0, phoneLength) })} placeholder={`${phoneLength}-digit phone number`} />
              </div>
              <div>
                <label className="label">Phone #2</label>
                <input type="tel" inputMode="numeric" maxLength={phoneLength} className="input" value={formData.phone2} onChange={(e) => setFormData({ ...formData, phone2: e.target.value.replace(/\D/g, '').slice(0, phoneLength) })} placeholder={`${phoneLength}-digit phone number`} />
              </div>
              <div>
                <label className="label">Mobile #</label>
                <div className="flex gap-1">
                  {dialCode && <span className="flex items-center px-2.5 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm font-semibold text-gray-700 whitespace-nowrap select-none">{dialCode}</span>}
                  <input type="tel" inputMode="numeric" maxLength={phoneLength} className="input flex-1" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, phoneLength) })} placeholder={`${phoneLength}-digit mobile number`} />
                </div>
              </div>
              <div>
                <label className="label">Fax #</label>
                <input type="text" className="input" value={formData.fax} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Aadhaar No</label>
                <input type="text" className="input" value={formData.aadhaar_no} onChange={(e) => setFormData({ ...formData, aadhaar_no: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <PatientDocumentUpload customFields={formData.custom_fields} onChange={(custom_fields) => setFormData({ ...formData, custom_fields })} />
              </div>
              <div>
                <label className="label">Family Doctor</label>
                <input type="text" className="input" value={formData.family_doctor} onChange={(e) => setFormData({ ...formData, family_doctor: e.target.value })} />
              </div>
            </div>
          </div>

          <ConfiguredFields module="Patients" values={formData.custom_fields} onChange={(custom_fields) => setFormData({ ...formData, custom_fields })} />

          {/* Action Buttons */}
          {submitError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{submitError}</p>
          )}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={() => navigate('/patients')} className="btn-secondary flex items-center space-x-2">
              <X className="w-4 h-4" /><span>Cancel</span>
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center space-x-2 disabled:cursor-not-allowed disabled:opacity-50">
              <Save className="w-4 h-4" /><span>{isSubmitting ? 'Updating...' : 'Update Patient'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPatient
