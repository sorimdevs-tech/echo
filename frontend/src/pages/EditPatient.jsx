import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, X } from 'lucide-react'
import { patientService } from '../api/patientService'
import AddableSelect from '../components/AddableSelect'

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
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatient()
  }, [id])

  const fetchPatient = async () => {
    try {
      const result = await patientService.getPatient(id)
      if (result.success) {
        setFormData(result.data)
      }
    } catch (error) {
      console.error('Error fetching patient:', error)
      alert('Error loading patient data')
      navigate('/patients')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await patientService.updatePatient(id, formData)
      navigate('/patients')
    } catch (error) {
      console.error('Error updating patient:', error)
      alert('Error updating patient')
    }
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
          <h1 className="text-2xl font-bold text-gray-800">Edit Patient</h1>
          <p className="text-sm text-gray-600 mt-1">Update patient information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Patient ID *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.patient_id}
                  onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="label">Salutation *</label>
                <AddableSelect field="patient_salutation" className="input" options={['Mr.','Mrs.','Ms.','Dr.','Prof.']} value={formData.salutation} onChange={(value) => setFormData({...formData, salutation:value})} />
              </div>

              <div>
                <label className="label">First Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
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
                <label className="label">Middle Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Age</label>
                <input
                  type="number"
                  className="input"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Date of Birth</label>
                <input
                  type="date"
                  className="input"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Gender *</label>
                <select
                  className="input"
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="UA">UA</option>
                </select>
              </div>

              <div>
                <label className="label">Marital Status</label>
                <AddableSelect field="patient_marital_status" className="input" options={['Single','Married','Divorced','Widowed']} value={formData.marital_status} onChange={(value) => setFormData({...formData, marital_status:value})} />
              </div>

              <div>
                <label className="label">Ethnic Origin</label>
                <AddableSelect field="patient_ethnic_origin" className="input" options={['Indian','Asian','African','European']} value={formData.ethnic_origin} onChange={(value) => setFormData({...formData, ethnic_origin:value})} />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <label className="label">Taluk</label>
                <input
                  type="text"
                  className="input"
                  value={formData.taluk}
                  onChange={(e) => setFormData({...formData, taluk: e.target.value})}
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
                <AddableSelect field="patient_country" className="input" options={['India','USA','UK']} value={formData.country} onChange={(value) => setFormData({...formData, country:value})} />
              </div>

              <div>
                <label className="label">State</label>
                <AddableSelect field="patient_state" className="input" options={['Karnataka','Maharashtra','Tamil Nadu','Kerala']} value={formData.state} onChange={(value) => setFormData({...formData, state:value})} />
              </div>

              <div>
                <label className="label">District/City</label>
                <AddableSelect field="patient_district_city" className="input" options={[]} value={formData.district_city} onChange={(value) => setFormData({...formData, district_city:value})} />
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
                <label className="label">Phone #1</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone1}
                  onChange={(e) => setFormData({...formData, phone1: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Phone #2</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone2}
                  onChange={(e) => setFormData({...formData, phone2: e.target.value})}
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

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Aadhaar No</label>
                <input
                  type="text"
                  className="input"
                  value={formData.aadhaar_no}
                  onChange={(e) => setFormData({...formData, aadhaar_no: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Family Doctor</label>
                <input
                  type="text"
                  className="input"
                  value={formData.family_doctor}
                  onChange={(e) => setFormData({...formData, family_doctor: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="btn-secondary flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button type="submit" className="btn-primary flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Update Patient</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPatient
