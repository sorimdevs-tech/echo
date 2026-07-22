import { useState, useEffect } from 'react'
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
  FileText,
  Printer,
  Activity,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'
import AddableSelect from '../components/AddableSelect'
import ReferralDoctorModal from '../components/ReferralDoctorModal'
import { workspaceService } from '../api/workspaceService'

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
  })

  const [visits, setVisits] = useState([])
  const [selectedScans, setSelectedScans] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const countries = ['India', 'USA', 'UK', 'Other']
  const states = ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Kerala', 'Other']
  const ethnicOrigins = ['Indian', 'Asian', 'African', 'European', 'Other']
  const salutations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed']

  useEffect(() => {
    workspaceService.getNextPatientId().then((result) => {
      if (result.data?.patient_id) setFormData((current) => current.patient_id ? current : {...current, patient_id:result.data.patient_id})
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const shouldGoToReport = e.nativeEvent.submitter?.value === 'reporting'
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
      for (const scanType of selectedScans) {
        await scanService.createScan({patient_id:patient.id,patient_display_id:patient.patient_id,visit_id:createdVisits[0]?.id||'',scan_type:scanType,status:'draft'})
      }
      if (shouldGoToReport && selectedScans.length) navigate(`/echo-studies?patient=${patient.id}&visit=${createdVisits[0]?.id||''}&type=${encodeURIComponent(selectedScans[0])}`)
      else navigate('/search')
    } catch (error) {
      console.error('Error creating patient:', error)
      alert('Error creating patient')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddVisit = () => {
    const newVisit = {
      id: Date.now(),
      visit_date: '',
      referral_doctor: '',
      image_count: '0',
      avi: '0',
      pregnancy: '0',
      ob: '',
    }
    setVisits([...visits, newVisit])
  }

  const handleUpdateVisit = (id, field, value) => {
    setVisits(visits.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const handleDeleteVisit = (id) => {
    setVisits(visits.filter(v => v.id !== id))
  }

  const toggleScan = (scanType) => {
    setSelectedScans(prev =>
      prev.includes(scanType)
        ? prev.filter(s => s !== scanType)
        : [...prev, scanType]
    )
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
  const selectClass = "w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white"
  const labelClass = "block text-xs font-medium text-slate-700 mb-1.5"

  return (
    <>
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
                      <AddableSelect field="patient_salutation" className={selectClass} options={salutations} value={formData.salutation} onChange={(value) => setFormData({...formData, salutation: value})} />
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
                          onChange={(e) => setFormData({...formData, dob: e.target.value})}
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
                      <AddableSelect field="patient_marital_status" className={selectClass} options={maritalStatuses} value={formData.marital_status} onChange={(value) => setFormData({...formData, marital_status: value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Ethnic Origin</label>
                      <AddableSelect field="patient_ethnic_origin" className={selectClass} options={ethnicOrigins} value={formData.ethnic_origin} onChange={(value) => setFormData({...formData, ethnic_origin: value})} />
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
                      <AddableSelect field="patient_country" className={selectClass} options={countries} value={formData.country} onChange={(value) => setFormData({...formData, country: value})} />
                    </div>

                    <div>
                      <label className={labelClass}>State</label>
                      <AddableSelect field="patient_state" className={selectClass} options={states} value={formData.state} onChange={(value) => setFormData({...formData, state: value})} />
                    </div>

                    <div>
                      <label className={labelClass}>District/City</label>
                      <AddableSelect field="patient_district_city" className={selectClass} options={[]} value={formData.district_city} onChange={(value) => setFormData({...formData, district_city: value})} />
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
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add new visit
                  </button>
                </div>
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
                            No visits recorded. Click "Add new visit" to create one.
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
                                value={visit.visit_date?.slice(0, 16)}
                                onChange={(e) => handleUpdateVisit(visit.id, 'visit_date', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm"
                                value={visit.referral_doctor}
                                onChange={(e) => handleUpdateVisit(visit.id, 'referral_doctor', e.target.value)}
                                placeholder="Referral doctor"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm w-20"
                                value={visit.image_count}
                                onChange={(e) => handleUpdateVisit(visit.id, 'image_count', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm w-20"
                                value={visit.avi}
                                onChange={(e) => handleUpdateVisit(visit.id, 'avi', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm w-20"
                                value={visit.pregnancy}
                                onChange={(e) => handleUpdateVisit(visit.id, 'pregnancy', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="input text-sm w-20"
                                value={visit.ob}
                                onChange={(e) => handleUpdateVisit(visit.id, 'ob', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteVisit(visit.id)}
                                className="text-red-600 hover:text-red-800 transition"
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
                  {['Adult Echo', 'Fetal Echo', 'Pediatric Echo'].map(scanType => (
                    <div
                      key={scanType}
                      role="button"
                      tabIndex={0}
                      onDoubleClick={(event) => { event.preventDefault(); navigate(`/echo-studies?type=${encodeURIComponent(scanType)}`) }}
                      onKeyDown={(event) => { if (event.key === 'Enter') navigate(`/echo-studies?type=${encodeURIComponent(scanType)}`) }}
                      title={`Double-click to open ${scanType}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-teal-300 hover:bg-teal-50 group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScans.includes(scanType)}
                        onChange={() => toggleScan(scanType)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                      />
                      <span className="min-w-0 flex-1"><span className="block text-sm text-slate-700 group-hover:text-teal-700">{scanType}</span><span className="block text-[11px] text-slate-400">Double-click to open</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleAddVisit}
                  className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add New Visit
                </button>

                <button
                  type="button"
                  onDoubleClick={() => setIsReferralModalOpen(true)}
                  title="Double-click to manage referral doctors and hospitals"
                  className="w-full px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition flex items-center justify-center gap-2 font-medium"
                >
                  <User className="w-4 h-4" />
                  New Referral Doctor
                </button>

                <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  value="reporting"
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
                  {isSubmitting ? 'Saving...' : 'Save Patient'}
                </button>
              </div>
            </div>
          </div>
      </div>
    </form>
    <ReferralDoctorModal
      open={isReferralModalOpen}
      onClose={() => setIsReferralModalOpen(false)}
      onSelect={(record) => setFormData({...formData, family_doctor: record.doctor_type === 'hospital' ? record.institution_name : `${record.first_name || ''} ${record.last_name || ''}`.trim()})}
    />
    </>
  )
}

export default NewPatient
