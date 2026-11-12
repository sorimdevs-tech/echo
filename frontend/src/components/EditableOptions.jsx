import { useEffect, useMemo, useState } from 'react'
import { customOptionService } from '../api/customOptionService'

// Choices are shared by report type and field. Entered report values are never
// changed merely because the saved list is unavailable.
export default function EditableOptions({ field, label, value, onChange, options = [], withPlus = true }) {
  const [saved, setSaved] = useState([])
  const [adding, setAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    const changed = event => {
      if (event.detail?.field === field) setSaved(current => [...new Set([...current, event.detail.value])])
    }
    window.addEventListener('echo:option-added', changed)
    setSaved([])
    customOptionService.getOptions(field).then(result => {
      if (active) setSaved(current => [...new Set([...current, ...(result.data || []).map(option => option.value).filter(Boolean)])])
    }).catch(() => { if (active) setError('Saved choices could not be loaded.') })
    return () => { active = false; window.removeEventListener('echo:option-added', changed) }
  }, [field])

  const choices = useMemo(() => [...new Set([...options, ...saved].filter(Boolean))], [options, saved])
  const add = async () => {
    const choice = newValue.trim()
    if (!choice || saving) return
    const existing = choices.find(item => item.toLocaleLowerCase() === choice.toLocaleLowerCase())
    if (existing) { onChange(existing); setAdding(false); setNewValue(''); return }
    setSaving(true); setError('')
    try {
      const result = await customOptionService.createOption(field, choice)
      const added = result.data?.value || choice
      window.dispatchEvent(new CustomEvent('echo:option-added', { detail: { field, value: added } }))
      onChange(added); setAdding(false); setNewValue('')
    } catch { setError('Could not save this choice. Try again.') }
    finally { setSaving(false) }
  }

  return <div className="min-w-0 w-full">
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="flex min-w-0 flex-1 items-center rounded-md border border-slate-300 bg-white">
        <input aria-label={label} className="legacy-input min-w-0 w-full border-0" value={value ?? ''} onChange={event => onChange(event.target.value)} placeholder="Select or type..." />
        <select aria-label={`Choose ${label}`} className="w-8 shrink-0 bg-transparent text-slate-500" value="" onChange={event => { if (event.target.value) onChange(event.target.value) }}>
          <option value=""></option>{choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
        </select>
      </div>
      {withPlus && <button type="button" className="legacy-plus-button" aria-label={`Add ${label} choice`} aria-expanded={adding} onClick={() => { setAdding(open => !open); setNewValue(value || ''); setError('') }}>+</button>}
    </div>
    {adding && <div className="mt-2 flex gap-1"><input aria-label={`New ${label} choice`} className="legacy-input min-w-0 flex-1" value={newValue} onChange={event => setNewValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add() } }} /><button type="button" className="secondary-button" disabled={saving || !newValue.trim()} onClick={add}>{saving ? 'Saving…' : 'Add'}</button><button type="button" className="secondary-button" onClick={() => { setAdding(false); setError('') }}>Cancel</button></div>}
    {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
  </div>
}
