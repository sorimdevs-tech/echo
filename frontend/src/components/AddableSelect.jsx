import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { customOptionService } from '../api/customOptionService'

export default function AddableSelect({ field, value, onChange, options = [], className = 'field-control' }) {
  const [customOptions, setCustomOptions] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    customOptionService.getOptions(field)
      .then((result) => { if (active) setCustomOptions((result.data || []).map((item) => item.value)) })
      .catch(() => { if (active) setError('Unable to load saved options') })
    return () => { active = false }
  }, [field])

  const allOptions = useMemo(
    () => [...new Set([...options.filter((item) => item && item !== 'Other'), ...customOptions])],
    [options, customOptions],
  )

  const saveOption = async () => {
    const nextValue = newValue.trim()
    if (!nextValue) return
    setSaving(true)
    setError('')
    try {
      const result = await customOptionService.createOption(field, nextValue)
      const savedValue = result.data?.value || nextValue
      setCustomOptions((current) => [...new Set([...current, savedValue])])
      onChange(savedValue)
      setNewValue('')
      setIsAdding(false)
    } catch {
      setError('Unable to save this option')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex gap-1">
        <select className={className} value={value || ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select</option>
          {allOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <button
          type="button"
          title={`Add ${field.replaceAll('_', ' ')}`}
          onClick={() => { setIsAdding(!isAdding); setError('') }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 transition hover:bg-teal-200"
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {isAdding && (
        <div className="mt-2 flex gap-1 rounded-lg border border-teal-200 bg-teal-50 p-2">
          <input
            className="min-w-0 flex-1 rounded-md border border-teal-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveOption() } }}
            placeholder="Enter a new value"
            autoFocus
          />
          <button type="button" disabled={saving || !newValue.trim()} onClick={saveOption} className="rounded-md bg-teal-600 px-3 text-white disabled:opacity-50">
            <Check className="h-4 w-4" />
          </button>
        </div>
      )}

      {customOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {customOptions.map((option) => (
            <button key={option} type="button" onClick={() => onChange(option)} className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-xs text-teal-800 hover:bg-teal-100">
              {option}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
