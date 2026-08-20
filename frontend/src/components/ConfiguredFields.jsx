import { useEffect, useMemo, useState } from 'react'
import { workspaceService } from '../api/workspaceService'

const keyFor = (field) => field.key || field.id || field.name

/** Renders administrator-configured fields for the selected application module. */
export default function ConfiguredFields({ module, values = {}, onChange, disabled = false }) {
  const [fields, setFields] = useState([])

  useEffect(() => {
    let active = true
    workspaceService.getSettings()
      .then((result) => {
        if (!active) return
        setFields((result.data?.customFields || []).filter((field) => field.module === module))
      })
      .catch(() => { if (active) setFields([]) })
    return () => { active = false }
  }, [module])

  const configured = useMemo(() => fields.filter((field) => field.name), [fields])
  if (!configured.length) return null

  const update = (field, value) => onChange?.({ ...values, [keyFor(field)]: value })

  return (
    <fieldset className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
      <legend className="px-2 text-sm font-semibold text-teal-900">Additional configured fields</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {configured.map((field) => {
          const key = keyFor(field)
          const value = values[key] ?? ''
          const required = Boolean(field.required)
          const label = <span>{field.name}{required ? ' *' : ''}</span>
          const options = String(field.options || '').split(',').map((option) => option.trim()).filter(Boolean)

          if (field.type === 'Checkbox') {
            return <label key={key} className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(value)} disabled={disabled} onChange={(event) => update(field, event.target.checked)} />{label}</label>
          }
          if (field.type === 'Textarea') {
            return <label key={key} className="field-label md:col-span-2">{label}<textarea required={required} disabled={disabled} className="field-control min-h-24" value={value} onChange={(event) => update(field, event.target.value)} /></label>
          }
          if (field.type === 'Dropdown') {
            return <label key={key} className="field-label">{label}<select required={required} disabled={disabled} className="field-control" value={value} onChange={(event) => update(field, event.target.value)}><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          }
          return <label key={key} className="field-label">{label}<input required={required} disabled={disabled} type={field.type === 'Number' ? 'number' : field.type === 'Date' ? 'date' : 'text'} className="field-control" value={value} onChange={(event) => update(field, event.target.value)} /></label>
        })}
      </div>
    </fieldset>
  )
}
