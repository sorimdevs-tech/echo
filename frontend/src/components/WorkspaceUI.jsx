import { Check, Save } from 'lucide-react'
import AddableSelect from './AddableSelect'

export function Workspace({ title, description, actions, children }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
    </div>
  )
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
      {items.map((item) => (
        <button
          type="button"
          key={typeof item === 'string' ? item : item.value}
          onClick={() => onChange(typeof item === 'string' ? item : item.value)}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
            value === (typeof item === 'string' ? item : item.value)
              ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          {typeof item === 'string' ? item : item.label}
        </button>
      ))}
    </div>
  )
}

export function Section({ title, description, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <div className="mb-4 border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function Field({ label, optionField, addable = false, type = 'text', value, onChange, options, placeholder, rows = 3, min, max }) {
  const common = {
    value: value ?? '',
    onChange: (event) => onChange?.(type === 'checkbox' ? event.target.checked : event.target.value),
  }

  return (
    <div className="field-label">
      <span>{label}</span>
      {type === 'select' && addable ? (
        <AddableSelect
          field={`select_${optionField || String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`}
          options={options}
          value={value}
          onChange={onChange}
        />
      ) : type === 'select' ? (
        <select className="field-control" {...common}>
          <option value="">Select</option>
          {options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="field-control h-auto py-2" rows={rows} placeholder={placeholder} {...common} />
      ) : type === 'checkbox' ? (
        <span className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
          <input type="checkbox" checked={Boolean(value)} onChange={common.onChange} className="h-4 w-4 rounded text-teal-600" />
          <span className="text-sm font-normal text-slate-700">Enabled</span>
        </span>
      ) : (
        <input className="field-control" type={type} placeholder={placeholder} min={min} max={max} {...common} />
      )}
    </div>
  )
}

export function FieldGrid({ fields, data, setData, columns = 'lg:grid-cols-4' }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${columns}`}>
      {fields.map(({ key, ...fieldProps }) => (
        <Field
          key={key}
          {...fieldProps}
          optionField={key}
          value={data[key]}
          onChange={(value) => setData({ ...data, [key]: value })}
        />
      ))}
    </div>
  )
}

export function SaveButton({ onClick, label = 'Save changes' }) {
  return <button type="button" onClick={onClick} className="primary-button"><Save className="h-4 w-4" />{label}</button>
}

export function SavedNotice({ visible }) {
  if (!visible) return null
  return <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" />Saved</span>
}

export const normalOptions = ['Normal', 'Abnormal', 'Not visualised', 'Not applicable']
