import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, Building2, User } from 'lucide-react'
import { referralDoctorService } from '../api/referralDoctorService'
import AddableSelect from '../components/AddableSelect'

function NewReferralDoctor() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    doctor_type: 'doctor',
    first_name: '',
    last_name: '',
    middle_name: '',
    salutation: 'Dr.',
    designation: '',
    speciality: '',
    qualification: '',
    institution_name: '',
    parent_institution: '',
    street: '',
    zip_code: '',
    country: '',
    state: '',
    district_city: '',
    area: '',
    area_po: '',
    phone1: '',
    phone2: '',
    mobile: '',
    fax: '',
    email: '',
    reg_no: '',
    set_as_default: false,
    inactive: false,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await referralDoctorService.createReferralDoctor(formData)
      navigate('/referral-doctors')
    } catch (error) {
      console.error('Error creating referral doctor:', error)
      alert('Error creating referral doctor')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">New Referral Doctor</h1>
          <p className="text-sm text-gray-600 mt-1">Add a new referral doctor or hospital</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Referred By
            </h3>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              {[['doctor', User, 'Doctor'], ['hospital', Building2, 'Hospital']].map(([type, Icon, label]) => (
                <button key={type} type="button" onClick={() => setFormData({...formData, doctor_type:type})} aria-pressed={formData.doctor_type === type} className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-300 ${formData.doctor_type === type ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
                  <Icon className="h-5 w-5" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Basic Information
            </h3>
            <div key={formData.doctor_type} className="referral-type-panel grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {formData.doctor_type === 'doctor' ? (
                <>
                  <div>
                    <label className="label">Salutation</label>
                    <select
                      className="input"
                      value={formData.salutation}
                      onChange={(e) => setFormData({...formData, salutation: e.target.value})}
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label">Middle Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.middle_name}
                      onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label">Registration No.</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.reg_no}
                      onChange={(e) => setFormData({...formData, reg_no: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label">Designation</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label">Speciality</label>
                    <AddableSelect field="referral_speciality" className="input" options={['Obstetrician & Gynecologist','Cardiologist','Pediatrician','Neurologist','General Physician']} value={formData.speciality} onChange={(value) => setFormData({...formData, speciality:value})} />
                  </div>

                  <div>
                    <label className="label">Qualification</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.qualification}
                      onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <div className="lg:col-span-3">
                  <label className="label">Hospital Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.institution_name}
                    onChange={(e) => setFormData({...formData, institution_name: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Institution Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Institution Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="label">Institution Name</label>
                <AddableSelect field="referral_institution" className="input" options={[]} value={formData.parent_institution} onChange={(value) => setFormData({...formData, parent_institution:value})} />
              </div>

              <div>
                <label className="label">Reg. No.</label>
                <input
                  type="text"
                  className="input"
                  value={formData.reg_no}
                  onChange={(e) => setFormData({...formData, reg_no: e.target.value})}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="label">Street Address</label>
                <input
                  type="text"
                  className="input"
                  value={formData.street}
                  onChange={(e) => setFormData({...formData, street: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Area</label>
                <input
                  type="text"
                  className="input"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Area (P.O.)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.area_po}
                  onChange={(e) => setFormData({...formData, area_po: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Zip Code</label>
                <input
                  type="text"
                  className="input"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Country</label>
                <AddableSelect field="referral_country" className="input" options={['India','USA','UK']} value={formData.country} onChange={(value) => setFormData({...formData, country:value})} />
              </div>

              <div>
                <label className="label">State</label>
                <AddableSelect field="referral_state" className="input" options={['Karnataka','Maharashtra','Tamil Nadu','Kerala']} value={formData.state} onChange={(value) => setFormData({...formData, state:value})} />
              </div>

              <div>
                <label className="label">District/City</label>
                <AddableSelect field="referral_district_city" className="input" options={[]} value={formData.district_city} onChange={(value) => setFormData({...formData, district_city:value})} />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Phone #</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone1}
                  onChange={(e) => setFormData({...formData, phone1: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Mobile #</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Fax #</label>
                <input
                  type="text"
                  className="input"
                  value={formData.fax}
                  onChange={(e) => setFormData({...formData, fax: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Options
            </h3>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.set_as_default}
                  onChange={(e) => setFormData({...formData, set_as_default: e.target.checked})}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-gray-800">Set as default</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inactive}
                  onChange={(e) => setFormData({...formData, inactive: e.target.checked})}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-gray-800">Inactive</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/referral-doctors')}
              className="btn-secondary flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button type="submit" className="btn-primary flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewReferralDoctor
