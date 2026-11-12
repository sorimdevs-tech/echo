import { useState } from 'react'
import { Field, Section, Workspace } from '../components/WorkspaceUI'

export const DEFAULT_DOCTOR_PROFILE = {
  name: '', initials: '', status: 'Not configured', avatarType: 'initials',
  degrees: '',
  designation: '',
  department: '',
  hospital: '',
  registrationNo: '',
  council: '',
  email: '',
  phone: '',
  altPhone: '',
  room: '',
  experience: '',
  opdHours: '',
  bio: '',
  avatarUrl: '',
  specializations: [], qualifications: [], memberships: [], publications: [], stats: {},
}

export const PROFILE_STORAGE_KEY = 'echoai_doctor_profile'

export default function Profile() {
  const [profile,setProfile]=useState(()=>{
    try { return {...DEFAULT_DOCTOR_PROFILE,...JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)||'{}')} }
    catch { return {...DEFAULT_DOCTOR_PROFILE} }
  })
  const [message,setMessage]=useState('')
  const save=event=>{
    event.preventDefault()
    try {
      const updated={...profile,initials:profile.name.trim().split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase()}
      localStorage.setItem(PROFILE_STORAGE_KEY,JSON.stringify(updated))
      localStorage.setItem('doctorProfile',JSON.stringify({name:updated.name,degree:updated.degrees,registration_no:updated.registrationNo,department:updated.department,hospital:updated.hospital}))
      setProfile(updated)
      window.dispatchEvent(new Event('doctor_profile_updated'))
      setMessage('Profile saved in this browser.')
    } catch {setMessage('Unable to save profile. Your entries remain on this page.')}
  }
  return <Workspace title="Doctor profile" description="Enter verified profile details. These settings are stored in this browser and do not change server account permissions.">
    <Section title="Profile details">
      <p className="mb-4 text-sm text-slate-600">Credentials are entered by the operator. No qualification verification, digital signature or AI performance certification is provided by this page.</p>
      <form onSubmit={save}>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries({name:'Name',degrees:'Qualifications',designation:'Designation',department:'Department',hospital:'Hospital / clinic',registrationNo:'Registration number',council:'Registration council',email:'Email',phone:'Phone',altPhone:'Alternative phone',room:'Room / address',opdHours:'Consultation hours'}).map(([key,label])=><Field key={key} label={label} type={key==='email'?'email':'text'} value={profile[key]||''} onChange={value=>setProfile(current=>({...current,[key]:value}))}/>)}
        </div>
        <button className="primary-button mt-4" type="submit">Save profile</button>
        {message&&<p role="status" className="mt-3">{message}</p>}
      </form>
    </Section>
  </Workspace>
}
