import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Save, Search, User, X } from 'lucide-react'
import { referralDoctorService } from '../api/referralDoctorService'
import { lookupOptionService } from '../api/lookupOptionService'

const referralLookupCategories = ['salutation', 'speciality', 'country', 'state']

export const initialReferralDoctorForm = {
  doctor_type: 'doctor',
  first_name: '',
  last_name: '',
  middle_name: '',
  salutation: '',
  designation: '',
  speciality: '',
  qualification: '',
  hospital_name: '',
  institution_name: '',
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
}

const referralDoctorFields = Object.keys(initialReferralDoctorForm)

function fieldValue(value) {
  return value ?? ''
}

function groupLookupOptions(options) {
  return referralLookupCategories.reduce((grouped, category) => {
    grouped[category] = options
      .filter((option) => option.category === category)
      .map((option) => option.value)
    return grouped
  }, {})
}

function withCurrentValue(options, currentValue) {
  if (!currentValue || options.includes(currentValue)) {
    return options
  }

  return [...options, currentValue]
}

function buildReferralDoctorPayload(formData) {
  return referralDoctorFields.reduce((payload, field) => {
    payload[field] = formData[field]
    return payload
  }, {})
}

export function ReferralDoctorForm({
  onSaved,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Close',
}) {
  const [formData, setFormData] = useState(initialReferralDoctorForm)
  const [referralDoctors, setReferralDoctors] = useState([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [doctorSearch, setDoctorSearch] = useState('')
  const [selectedReferralDoctorId, setSelectedReferralDoctorId] = useState('')
  const [lookupOptions, setLookupOptions] = useState(() => groupLookupOptions([]))
  const [addingOptionField, setAddingOptionField] = useState(null)
  const [newOptionValue, setNewOptionValue] = useState('')
  const [optionError, setOptionError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setStatusMessage('')
  }

  const fetchReferralDoctors = async () => {
    setIsLoadingDoctors(true)

    try {
      const result = await referralDoctorService.getReferralDoctors()
      if (result.success) {
        setReferralDoctors(result.data)
        return result.data
      }
    } catch (error) {
      console.error('Error loading referral doctors:', error)
      setReferralDoctors([])
    } finally {
      setIsLoadingDoctors(false)
    }

    return []
  }

  useEffect(() => {
    fetchReferralDoctors()
  }, [])

  useEffect(() => {
    const fetchLookupOptions = async () => {
      setOptionError('')

      try {
        const result = await lookupOptionService.getLookupOptions()
        if (result.success) {
          setLookupOptions(groupLookupOptions(result.data))
        }
      } catch (error) {
        console.error('Error loading referral lookup options:', error)
        setOptionError('Could not load dropdown options from the database.')
      }
    }

    fetchLookupOptions()
  }, [])

  const handleSelectReferralDoctor = (doctor) => {
    setSelectedReferralDoctorId(doctor.id)
    setStatusMessage('')
    setFormData({
      ...initialReferralDoctorForm,
      ...doctor,
      doctor_type: doctor.doctor_type || 'doctor',
      country: doctor.country || '',
      speciality: doctor.speciality || '',
    })
  }

  const handleClearReferralDoctor = () => {
    setSelectedReferralDoctorId('')
    setFormData(initialReferralDoctorForm)
    setStatusMessage('')
  }

  const handleAddOption = (field) => {
    setAddingOptionField(field)
    setNewOptionValue('')
    setOptionError('')
  }

  const handleSaveOption = async (field) => {
    const trimmedValue = newOptionValue.trim()
    if (!trimmedValue) return

    try {
      const result = await lookupOptionService.createLookupOption(field, trimmedValue)
      const savedValue = result.data?.value || trimmedValue

      setLookupOptions((current) => ({
        ...current,
        [field]: withCurrentValue(current[field] || [], savedValue),
      }))
      updateField(field, savedValue)
      setAddingOptionField(null)
      setNewOptionValue('')
      setOptionError('')
    } catch (error) {
      console.error('Error saving referral lookup option:', error)
      setOptionError('Could not save the new dropdown value.')
    }
  }

  const handleCancelOption = () => {
    setAddingOptionField(null)
    setNewOptionValue('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setOptionError('')
    setStatusMessage('')

    try {
      const payload = buildReferralDoctorPayload(formData)
      const existingDoctorId = formData.id

      if (payload.doctor_type === 'hospital' && !payload.institution_name) {
        payload.institution_name = payload.hospital_name
      }

      const result = existingDoctorId
        ? await referralDoctorService.updateReferralDoctor(existingDoctorId, payload)
        : await referralDoctorService.createReferralDoctor(payload)
      const savedDoctor = result.data

      setFormData({
        ...initialReferralDoctorForm,
        ...savedDoctor,
      })
      setSelectedReferralDoctorId(savedDoctor.id)
      await fetchReferralDoctors()
      setStatusMessage(existingDoctorId ? 'Referral doctor updated.' : 'Referral doctor saved.')
      onSaved?.(savedDoctor)
    } catch (error) {
      console.error('Error creating referral doctor:', error)
      setOptionError('Could not save referral doctor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isHospital = formData.doctor_type === 'hospital'
  const normalizedDoctorSearch = doctorSearch.trim().toLowerCase()
  const filteredReferralDoctors = normalizedDoctorSearch
    ? referralDoctors.filter((doctor) => {
        const searchableText = [
          doctor.first_name,
          doctor.last_name,
          doctor.institution_name,
          doctor.hospital_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(normalizedDoctorSearch)
      })
    : referralDoctors

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-4 flex flex-wrap items-center gap-5">
          <span className="text-sm font-semibold text-slate-800">Referred by</span>
          <RadioChoice
            label="Doctor"
            icon={User}
            checked={!isHospital}
            onChange={() => updateField('doctor_type', 'doctor')}
          />
          <RadioChoice
            label="Hospital"
            icon={Building2}
            checked={isHospital}
            onChange={() => updateField('doctor_type', 'hospital')}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {isHospital ? (
            <>
              <Field
                label="Hospital name"
                value={formData.hospital_name}
                onChange={(value) => updateField('hospital_name', value)}
                className="lg:col-span-2"
              />
              <Field
                label="Hospital Reg. no"
                value={formData.reg_no}
                onChange={(value) => updateField('reg_no', value)}
              />
              <LookupSelectField
                label="Speciality"
                field="speciality"
                value={formData.speciality}
                onChange={(value) => updateField('speciality', value)}
                options={withCurrentValue(lookupOptions.speciality || [], formData.speciality)}
                addingField={addingOptionField}
                newValue={newOptionValue}
                onAdd={handleAddOption}
                onNewValueChange={setNewOptionValue}
                onSave={handleSaveOption}
                onCancel={handleCancelOption}
              />
              <Field
                label="Qualification"
                value={formData.qualification}
                onChange={(value) => updateField('qualification', value)}
              />
              <Field
                label="Institution"
                value={formData.institution_name}
                onChange={(value) => updateField('institution_name', value)}
              />
              <Field
                label="Designation"
                value={formData.designation}
                onChange={(value) => updateField('designation', value)}
              />
              <Field
                label="Street"
                value={formData.street}
                onChange={(value) => updateField('street', value)}
              />
              <Field
                label="Area (P.O.)"
                value={formData.area_po}
                onChange={(value) => updateField('area_po', value)}
              />
              <Field
                label="Area"
                value={formData.area}
                onChange={(value) => updateField('area', value)}
              />
              <Field
                label="City"
                value={formData.district_city}
                onChange={(value) => updateField('district_city', value)}
              />
              <Field
                label="Zip Code"
                value={formData.zip_code}
                onChange={(value) => updateField('zip_code', value)}
              />
              <LookupSelectField
                label="Country"
                field="country"
                value={formData.country}
                onChange={(value) => updateField('country', value)}
                options={withCurrentValue(lookupOptions.country || [], formData.country)}
                addingField={addingOptionField}
                newValue={newOptionValue}
                onAdd={handleAddOption}
                onNewValueChange={setNewOptionValue}
                onSave={handleSaveOption}
                onCancel={handleCancelOption}
              />
              <LookupSelectField
                label="State"
                field="state"
                value={formData.state}
                onChange={(value) => updateField('state', value)}
                options={withCurrentValue(lookupOptions.state || [], formData.state)}
                addingField={addingOptionField}
                newValue={newOptionValue}
                onAdd={handleAddOption}
                onNewValueChange={setNewOptionValue}
                onSave={handleSaveOption}
                onCancel={handleCancelOption}
              />
              <Field
                label="Phone #"
                type="tel"
                value={formData.phone1}
                onChange={(value) => updateField('phone1', value)}
              />
              <Field
                label="Fax"
                value={formData.fax}
                onChange={(value) => updateField('fax', value)}
              />
              <Field
                label="Email Id"
                type="email"
                value={formData.email}
                onChange={(value) => updateField('email', value)}
              />

              <div className="border-t border-slate-200 pt-3 md:col-span-2 lg:col-span-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field
                    label="First name"
                    value={formData.first_name}
                    onChange={(value) => updateField('first_name', value)}
                  />
                  <Field
                    label="Last name"
                    value={formData.last_name}
                    onChange={(value) => updateField('last_name', value)}
                  />
                  <Field
                    label="Mobile #"
                    type="tel"
                    value={formData.mobile}
                    onChange={(value) => updateField('mobile', value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <LookupSelectField
                label="Salutation"
                field="salutation"
                value={formData.salutation}
                onChange={(value) => updateField('salutation', value)}
                options={withCurrentValue(lookupOptions.salutation || [], formData.salutation)}
                addingField={addingOptionField}
                newValue={newOptionValue}
                onAdd={handleAddOption}
                onNewValueChange={setNewOptionValue}
                onSave={handleSaveOption}
                onCancel={handleCancelOption}
              />
              <Field
                label="First name"
                value={formData.first_name}
                onChange={(value) => updateField('first_name', value)}
              />
              <Field
                label="Last name"
                value={formData.last_name}
                onChange={(value) => updateField('last_name', value)}
              />
              <Field
                label="Middle name"
                value={formData.middle_name}
                onChange={(value) => updateField('middle_name', value)}
              />
              <Field
                label="Reg. no"
                value={formData.reg_no}
                onChange={(value) => updateField('reg_no', value)}
              />
              <LookupSelectField
                label="Speciality"
                field="speciality"
                value={formData.speciality}
                onChange={(value) => updateField('speciality', value)}
                options={withCurrentValue(lookupOptions.speciality || [], formData.speciality)}
                addingField={addingOptionField}
                newValue={newOptionValue}
                onAdd={handleAddOption}
                onNewValueChange={setNewOptionValue}
                onSave={handleSaveOption}
                onCancel={handleCancelOption}
              />
              <Field
                label="Qualification"
                value={formData.qualification}
                onChange={(value) => updateField('qualification', value)}
              />
              <Field
                label="Institution"
                value={formData.institution_name}
                onChange={(value) => updateField('institution_name', value)}
              />
              <Field
                label="Designation"
                value={formData.designation}
                onChange={(value) => updateField('designation', value)}
              />
              <Field
                label="Street"
                value={formData.street}
                onChange={(value) => updateField('street', value)}
              />
              <Field
                label="Area (P.O.)"
                value={formData.area_po}
                onChange={(value) => updateField('area_po', value)}
              />
              <Field
                label="Area"
                value={formData.area}
                onChange={(value) => updateField('area', value)}
              />
              <Field
                label="City"
                value={formData.district_city}
                onChange={(value) => updateField('district_city', value)}
              />
              <Field
                label="Zip Code"
                value={formData.zip_code}
                onChange={(value) => updateField('zip_code', value)}
              />
              <LookupSelectField
                label="Country"
                field="country"
                value={formData.country}
                onChange={(value) => updateField('country', value)}
                options={withCurrentValue(lookupOptions.country || [], formData.country)}
                addingField={addingOptionField}
                newValue={newOptionValue}
                onAdd={handleAddOption}
                onNewValueChange={setNewOptionValue}
                onSave={handleSaveOption}
                onCancel={handleCancelOption}
              />
              <LookupSelectField
                label="State"
                field="state"
                value={formData.state}
                onChange={(value) => updateField('state', value)}
                options={withCurrentValue(lookupOptions.state || [], formData.state)}
                addingField={addingOptionField}
                newValue={newOptionValue}
                onAdd={handleAddOption}
                onNewValueChange={setNewOptionValue}
                onSave={handleSaveOption}
                onCancel={handleCancelOption}
              />
              <Field
                label="Phone #"
                type="tel"
                value={formData.phone1}
                onChange={(value) => updateField('phone1', value)}
              />
              <Field
                label="Mobile #"
                type="tel"
                value={formData.mobile}
                onChange={(value) => updateField('mobile', value)}
              />
              <Field
                label="Fax"
                value={formData.fax}
                onChange={(value) => updateField('fax', value)}
              />
              <Field
                label="Email Id"
                type="email"
                value={formData.email}
                onChange={(value) => updateField('email', value)}
              />
            </>
          )}
        </div>

        {optionError && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {optionError}
          </p>
        )}
        {statusMessage && (
          <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {statusMessage}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.set_as_default}
              onChange={(event) => updateField('set_as_default', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Set as default</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.inactive}
              onChange={(event) => updateField('inactive', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Inactive</span>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={doctorSearch}
              onChange={(event) => setDoctorSearch(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="Search doctor or institution"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="max-h-56 overflow-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="bg-sky-50">
                <tr>
                  <th className="w-12 border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Select</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">First name</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Last name</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Registration no</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Speciality</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Institution name</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Mobile number</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferralDoctors.map((doctor) => {
                  const isSelected = selectedReferralDoctorId === doctor.id

                  return (
                  <tr
                    key={doctor.id}
                    onClick={() => handleSelectReferralDoctor(doctor)}
                    className={`cursor-pointer hover:bg-teal-50 ${
                      isSelected ? 'bg-teal-50' : 'odd:bg-white even:bg-sky-50/60'
                    }`}
                  >
                    <td className="border-b border-slate-100 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => {
                          event.stopPropagation()
                          if (event.target.checked) {
                            handleSelectReferralDoctor(doctor)
                          } else {
                            handleClearReferralDoctor()
                          }
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        aria-label={`Select ${doctor.first_name || doctor.hospital_name || 'referral doctor'}`}
                      />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-800">{doctor.first_name || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-800">{doctor.last_name || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-800">{doctor.reg_no || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-800">{doctor.speciality || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-800">
                      {doctor.institution_name || doctor.hospital_name || '-'}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-800">{doctor.mobile || '-'}</td>
                  </tr>
                  )
                })}
                {!isLoadingDoctors && referralDoctors.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-sm text-slate-500">
                      No referral doctors recorded yet.
                    </td>
                  </tr>
                )}
                {!isLoadingDoctors && referralDoctors.length > 0 && filteredReferralDoctors.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-sm text-slate-500">
                      No referral doctors match your search.
                    </td>
                  </tr>
                )}
                {isLoadingDoctors && (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-sm text-slate-500">
                      Loading referral doctors...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-slate-200 bg-white/95 py-3 pt-4 backdrop-blur">
        {(statusMessage || optionError) && (
          <div className={`mr-auto rounded-md border px-3 py-2 text-sm font-medium ${
            optionError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {optionError || statusMessage}
          </div>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          <span>{cancelLabel}</span>
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? 'Saving...' : submitLabel}</span>
        </button>
      </div>
    </form>
  )
}

function Field({ label, value, onChange, type = 'text', className = '' }) {
  return (
    <div className={className}>
      <label className="label text-xs">{label}</label>
      <input
        type={type}
        className="input h-9 rounded-md text-sm"
        value={fieldValue(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function LookupSelectField({
  label,
  field,
  value,
  onChange,
  options,
  addingField,
  newValue,
  onAdd,
  onNewValueChange,
  onSave,
  onCancel,
}) {
  const isAdding = addingField === field

  return (
    <div>
      <label className="label text-xs">{label}</label>
      <div className="flex gap-1">
        <select
          className="input h-9 rounded-md text-sm"
          value={fieldValue(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {isAdding ? (
          <input
            type="text"
            className="h-9 w-28 rounded-md border border-teal-300 px-2 text-sm outline-none focus:ring-2 focus:ring-teal-100"
            placeholder="New"
            value={newValue}
            onChange={(event) => onNewValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onSave(field)
              } else if (event.key === 'Escape') {
                onCancel()
              }
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => onAdd(field)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-100 text-teal-700 transition hover:bg-teal-200"
            title={`Add ${label.toLowerCase()}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function RadioChoice({ label, icon: Icon, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
      />
      <Icon className="h-4 w-4 text-slate-500" />
      <span>{label}</span>
    </label>
  )
}

function NewReferralDoctor() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-6xl overflow-auto">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">New Referral Doctor</h1>
          <p className="mt-1 text-sm text-gray-600">Add a new referral doctor or hospital</p>
        </div>

        <div className="p-6">
          <ReferralDoctorForm
            onCancel={() => navigate('/referral-doctors')}
            cancelLabel="Cancel"
          />
        </div>
      </div>
    </div>
  )
}

export default NewReferralDoctor
