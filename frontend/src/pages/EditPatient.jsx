import { useParams } from 'react-router-dom'
import NewPatient from './NewPatient'

function EditPatient() {
  const { id } = useParams()

  return <NewPatient mode="edit" patientId={id || ''} />
}

export default EditPatient
