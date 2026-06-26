import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, Building2, User } from 'lucide-react'
import { referralDoctorService } from '../api/referralDoctorService'

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
    street: '',
    zip_code: '',
    country: 'India',
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
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="doctor"
                  checked={formData.doctor_type === 'doctor'}
                  onChange={(e) => setFormData({...formData, doctor_type: e.target.value})}
                  className="w-4 h-4 text-primary-600"
                />
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-800 font-medium">Doctor</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="hospital"
                  checked={formData.doctor_type === 'hospital'}
                  onChange={(e) => setFormData({...formData, doctor_type: e.target.value})}
                  className="w-4 h-4 text-primary-600"
                />
                <Building2 className="w-5 h-5 text-gray-600" />
                <span className="text-gray-800 font-medium">Hospital</span>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <select
                      className="input"
                      value={formData.speciality}
                      onChange={(e) => setFormData({...formData, speciality: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option value="Obstetrician & Gynecologist">Obstetrician & Gynecologist</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="General Physician">General Physician</option>
                      <option value="Other">Other</option>
                    </select>
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
                <input
                  type="text"
                  className="input"
                  value={formData.institution_name}
                  onChange={(e) => setFormData({...formData, institution_name: e.target.value})}
                />
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
                <select
                  className="input"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                >
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                </select>
              </div>

              <div>
                <label className="label">State</label>
                <select
                  className="input"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                >
                  <option value="">Select</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Kerala">Kerala</option>
                </select>
              </div>

              <div>
                <label className="label">District/City</label>
                <input
                  type="text"
                  className="input"
                  value={formData.district_city}
                  onChange={(e) => setFormData({...formData, district_city: e.target.value})}
                />
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