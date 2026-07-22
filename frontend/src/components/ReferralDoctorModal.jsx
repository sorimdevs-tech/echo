import { useEffect, useMemo, useState } from 'react'
import { Building2, RotateCcw, Save, Trash2, User, X } from 'lucide-react'
import AddableSelect from './AddableSelect'
import { referralDoctorService } from '../api/referralDoctorService'

const emptyForm = {
  doctor_type: 'doctor', salutation: 'Dr.', first_name: '', middle_name: '', last_name: '',
  institution_name: '', parent_institution: '', reg_no: '', speciality: '', qualification: '', designation: '',
  street: '', zip_code: '', country: '', state: '', district_city: '', area: '', area_po: '',
  phone1: '', phone2: '', mobile: '', fax: '', email: '', family_doctor: '', set_as_default: false, inactive: false,
}

export default function ReferralDoctorModal({ open, onClose, onSaved, onSelect }) {
  const [form, setForm] = useState(emptyForm)
  const [records, setRecords] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const loadRecords = async () => {
    setLoading(true)
    try { const result = await referralDoctorService.getReferralDoctors(); setRecords(result.data || []) }
    catch { setRecords([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (open) loadRecords() }, [open])

  const filtered = useMemo(() => records.filter((record) => {
    const text = `${record.first_name || ''} ${record.last_name || ''} ${record.institution_name || ''} ${record.speciality || ''}`.toLowerCase()
    return text.includes(search.toLowerCase())
  }), [records, search])

  if (!open) return null

  const save = async () => {
    setSaving(true)
    try {
      const result = await referralDoctorService.createReferralDoctor(form)
      setForm(emptyForm)
      await loadRecords()
      onSaved?.(result.data)
    } catch { alert('Unable to save the referral record') }
    finally { setSaving(false) }
  }

  const remove = async () => {
    if (!selectedId) return
    await referralDoctorService.deleteReferralDoctor(selectedId)
    setSelectedId('')
    await loadRecords()
  }

  const update = (key, value) => setForm({ ...form, [key]: value })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Referral doctors and hospitals">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-primary-50 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Referral Doctors & Hospitals</h2>
            <p className="text-sm text-slate-500">Create, review, select, or remove a referral record.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={saving} className="primary-button"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={remove} disabled={!selectedId} className="secondary-button text-red-700 disabled:opacity-40"><Trash2 className="h-4 w-4" />Delete</button>
            <button type="button" onClick={() => setForm(emptyForm)} className="secondary-button"><RotateCcw className="h-4 w-4" />Clear</button>
            <button type="button" onClick={onClose} className="secondary-button"><X className="h-4 w-4" />Close</button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-semibold text-slate-700">Referred by</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              {['doctor', 'hospital'].map((type) => <button key={type} type="button" onClick={() => update('doctor_type', type)} aria-pressed={form.doctor_type === type} className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-all duration-300 ${form.doctor_type === type ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>{type === 'doctor' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}{type}</button>)}
            </div>
          </div>

          <div key={form.doctor_type} className="referral-type-panel grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {form.doctor_type === 'doctor' ? <>
              <SelectField label="Salutation" field="referral_salutation" options={['Dr.','Prof.','Mr.','Mrs.','Ms.']} value={form.salutation} onChange={(value) => update('salutation', value)} />
              <TextField label="First name" value={form.first_name} onChange={(value) => update('first_name', value)} />
              <TextField label="Middle name" value={form.middle_name} onChange={(value) => update('middle_name', value)} />
              <TextField label="Last name" value={form.last_name} onChange={(value) => update('last_name', value)} />
            </> : <TextField label="Hospital name" value={form.institution_name} onChange={(value) => update('institution_name', value)} />}
            <TextField label="Registration number" value={form.reg_no} onChange={(value) => update('reg_no', value)} />
            <SelectField label="Speciality" field="referral_speciality" options={['Obstetrician & Gynecologist','Cardiologist','Pediatrician','Neurologist','General Physician']} value={form.speciality} onChange={(value) => update('speciality', value)} />
            <TextField label="Qualification" value={form.qualification} onChange={(value) => update('qualification', value)} />
            <TextField label="Designation" value={form.designation} onChange={(value) => update('designation', value)} />
            <SelectField label="Institution" field="referral_institution" value={form.parent_institution} onChange={(value) => update('parent_institution', value)} />
            <TextField label="Street" value={form.street} onChange={(value) => update('street', value)} />
            <TextField label="Zip code" value={form.zip_code} onChange={(value) => update('zip_code', value)} />
            <SelectField label="Country" field="referral_country" options={['India','Australia','USA','UK']} value={form.country} onChange={(value) => update('country', value)} />
            <SelectField label="State" field="referral_state" options={['Karnataka','Maharashtra','Tamil Nadu','Kerala','Victoria','New South Wales']} value={form.state} onChange={(value) => update('state', value)} />
            <SelectField label="City" field="referral_district_city" value={form.district_city} onChange={(value) => update('district_city', value)} />
            <TextField label="Area" value={form.area} onChange={(value) => update('area', value)} />
            <TextField label="Area (P.O.)" value={form.area_po} onChange={(value) => update('area_po', value)} />
            <TextField label="Phone" value={form.phone1} onChange={(value) => update('phone1', value)} />
            <TextField label="Phone #2" value={form.phone2} onChange={(value) => update('phone2', value)} />
            <TextField label="Mobile" value={form.mobile} onChange={(value) => update('mobile', value)} />
            <TextField label="Fax" value={form.fax} onChange={(value) => update('fax', value)} />
            <TextField label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} />
            <TextField label="Family doctor" value={form.family_doctor} onChange={(value) => update('family_doctor', value)} />
          </div>

          <div className="mt-4 flex gap-5 rounded-lg border border-slate-200 px-4 py-3">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.set_as_default} onChange={(event) => update('set_as_default', event.target.checked)} />Set as default</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.inactive} onChange={(event) => update('inactive', event.target.checked)} />Inactive</label>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-3"><h3 className="text-sm font-semibold text-slate-900">Saved referral records</h3><input className="field-control max-w-xs" placeholder="Search records…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <div className="max-h-64 overflow-auto">
              <table className="data-table min-w-[760px]"><thead><tr><th>Name</th><th>Type</th><th>Registration</th><th>Speciality</th><th>Institution</th><th>City</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id} onClick={() => setSelectedId(record.id)} onDoubleClick={() => { onSelect?.(record); onClose?.() }} className={selectedId === record.id ? 'selected-row' : ''}><td>{record.doctor_type === 'hospital' ? record.institution_name : `${record.first_name || ''} ${record.last_name || ''}`.trim()}</td><td className="capitalize">{record.doctor_type}</td><td>{record.reg_no || '—'}</td><td>{record.speciality || '—'}</td><td>{record.parent_institution || record.institution_name || '—'}</td><td>{record.district_city || '—'}</td></tr>)}</tbody></table>
              {!loading && !filtered.length && <p className="py-8 text-center text-sm text-slate-500">No referral doctors or hospitals found.</p>}
              {loading && <p className="py-8 text-center text-sm text-slate-500">Loading referral records…</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, type = 'text' }) {
  return <label className="field-label"><span>{label}</span><input className="field-control" type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} /></label>
}

function SelectField({ label, field, value, onChange, options = [] }) {
  return <div className="field-label"><span>{label}</span><AddableSelect field={field} options={options} value={value} onChange={onChange} /></div>
}
