import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ReferralDoctorForm } from './NewReferralDoctor'
import { referralDoctorService } from '../api/referralDoctorService'

function EditReferralDoctor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadDoctor = async () => {
      try {
        const result = await referralDoctorService.getReferralDoctor(id)
        if (active) setDoctor(result.data)
      } catch (requestError) {
        console.error('Error loading referral doctor:', requestError)
        if (active) setError('Could not load this referral doctor.')
      }
    }

    if (id) loadDoctor()
    return () => { active = false }
  }, [id])

  return (
    <div className="mx-auto w-full max-w-6xl overflow-auto">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Edit Referral Doctor</h1>
          <p className="mt-1 text-sm text-gray-600">Update a referral doctor or hospital</p>
        </div>
        <div className="p-6">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {!error && !doctor && <div className="text-sm text-slate-500">Loading referral doctor...</div>}
          {doctor && (
            <ReferralDoctorForm
              initialDoctor={doctor}
              onCancel={() => navigate('/referral-doctors')}
              cancelLabel="Cancel"
              submitLabel="Update"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default EditReferralDoctor
