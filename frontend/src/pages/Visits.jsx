import { useEffect, useState } from 'react'
import { Calendar, Clock, User, Search } from 'lucide-react'
import { patientService } from '../api/patientService'

function Visits() {
  const [visits, setVisits] = useState([])
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [visitData, setVisitData] = useState({
    visit_date: new Date().toISOString().slice(0, 16),
    referral_doctor: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const result = await patientService.getPatients()
      if (result.success) {
        setPatients(result.data)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handlePatientChange = async (patientId) => {
    setSelectedPatient(patientId)
    if (patientId) {
      setLoading(true)
      try {
        const result = await patientService.getVisits(patientId)
        if (result.success) {
          setVisits(result.data)
        }
      } catch (error) {
        console.error('Error fetching visits:', error)
      } finally {
        setLoading(false)
      }
    } else {
      setVisits([])
    }
  }

  const handleAddVisit = async (e) => {
    e.preventDefault()
    if (!selectedPatient) {
      alert('Please select a patient')
      return
    }
    try {
      const result = await patientService.addVisit(selectedPatient, visitData)
      if (result.success) {
        setVisits([result.data, ...visits])
        setVisitData({
          visit_date: new Date().toISOString().slice(0, 16),
          referral_doctor: '',
          notes: '',
        })
        alert('Visit added successfully')
      }
    } catch (error) {
      console.error('Error adding visit:', error)
      alert('Error adding visit')
    }
  }

  const selectedPatientData = patients.find(p => p.id === selectedPatient)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Visits</h1>
        <p className="text-sm text-gray-600 mt-1">Manage patient visits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Patient</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                className="input pl-10"
                list="patients-list"
                onChange={(e) => {
                  const patient = patients.find(p => 
                    `${p.first_name} ${p.last_name}`.toLowerCase().includes(e.target.value.toLowerCase())
                  )
                  if (patient) {
                    handlePatientChange(patient.id)
                  }
                }}
              />
              <datalist id="patients-list">
                {patients.map(patient => (
                  <option key={patient.id} value={`${patient.first_name} ${patient.last_name}`}>
                    {patient.patient_id}
                  </option>
                ))}
              </datalist>
            </div>

            <select
              className="input"
              value={selectedPatient}
              onChange={(e) => handlePatientChange(e.target.value)}
            >
              <option value="">-- Select Patient --</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.patient_id} - {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>

            {selectedPatientData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Patient Details</h4>
                <p className="text-sm text-gray-600">ID: {selectedPatientData.patient_id}</p>
                <p className="text-sm text-gray-600">
                  Name: {selectedPatientData.salutation} {selectedPatientData.first_name} {selectedPatientData.last_name}
                </p>
                <p className="text-sm text-gray-600">Gender: {selectedPatientData.gender}</p>
                <p className="text-sm text-gray-600">Age: {selectedPatientData.age}</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Visit Form & Visit History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Visit Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Visit</h3>
            <form onSubmit={handleAddVisit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Visit Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={visitData.visit_date}
                    onChange={(e) => setVisitData({...visitData, visit_date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="label">Referred By</label>
                  <input
                    type="text"
                    className="input"
                    value={visitData.referral_doctor}
                    onChange={(e) => setVisitData({...visitData, referral_doctor: e.target.value})}
                    placeholder="Doctor/Hospital name"
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  rows="3"
                  value={visitData.notes}
                  onChange={(e) => setVisitData({...visitData, notes: e.target.value})}
                  placeholder="Visit notes..."
                ></textarea>
              </div>

              <button type="submit" className="btn-primary flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Add Visit</span>
              </button>
            </form>
          </div>

          {/* Visit History */}
          {selectedPatient && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Visit History</h3>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading visits...</div>
              ) : visits.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No visits recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.map((visit) => (
                    <div key={visit.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="bg-primary-100 p-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-primary-700" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {new Date(visit.visit_date).toLocaleString()}
                            </p>
                            {visit.referral_doctor && (
                              <p className="text-sm text-gray-600 mt-1">
                                Referred by: {visit.referral_doctor}
                              </p>
                            )}
                            {visit.notes && (
                              <p className="text-sm text-gray-600 mt-1">{visit.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Visits