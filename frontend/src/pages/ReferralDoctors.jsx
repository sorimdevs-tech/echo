import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2, Edit, Stethoscope, UserPlus } from 'lucide-react'
import { referralDoctorService } from '../api/referralDoctorService'
import ReferralDoctorModal from '../components/ReferralDoctorModal'

function ReferralDoctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const result = await referralDoctorService.getReferralDoctors()
      if (result.success) {
        setDoctors(result.data)
      }
    } catch (error) {
      console.error('Error fetching referral doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this referral doctor?')) {
      try {
        await referralDoctorService.deleteReferralDoctor(id)
        setDoctors(doctors.filter(d => d.id !== id))
      } catch (error) {
        console.error('Error deleting referral doctor:', error)
        alert('Error deleting referral doctor')
      }
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    doctor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.speciality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.institution_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading referral doctors...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Referral Doctors</h1>
          <p className="text-sm text-gray-600 mt-1">Manage referral doctor records</p>
        </div>
        <button type="button" onDoubleClick={() => setIsReferralModalOpen(true)} title="Double-click to manage referral doctors and hospitals" className="btn-primary flex items-center space-x-2">
          <UserPlus className="w-4 h-4" />
          <span>New Referral Doctor</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search referral doctors..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="p-12 text-center">
            <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No referral doctors found</h3>
            <p className="text-gray-500 mb-4">Get started by adding a new referral doctor.</p>
            <Link to="/referral-doctors/new" className="btn-primary inline-flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Referral Doctor</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Speciality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qualification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.first_name} {doctor.last_name}
                      </div>
                      {doctor.designation && (
                        <div className="text-xs text-gray-500">{doctor.designation}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.speciality || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.qualification || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.institution_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.mobile || doctor.phone1 || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.doctor_type === 'hospital' ? 'Hospital' : 'Doctor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/referral-doctors/edit/${doctor.id}`}
                          className="text-primary-600 hover:text-primary-900 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredDoctors.length}</span> of{' '}
                <span className="font-medium">{doctors.length}</span> referral doctors
              </p>
            </div>
          </div>
        )}
      </div>
      <ReferralDoctorModal open={isReferralModalOpen} onClose={() => setIsReferralModalOpen(false)} onSaved={fetchDoctors} />
    </div>
  )
}

export default ReferralDoctors
