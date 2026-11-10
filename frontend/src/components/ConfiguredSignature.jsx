import { useEffect, useState } from 'react'
import { workspaceService } from '../api/workspaceService'

export function ConfiguredSignatureSelect({ label, value, onChange }) {
  const [signatures, setSignatures] = useState([])
  useEffect(() => { workspaceService.getSettings().then((result) => setSignatures(result.data?.signatures || [])).catch(() => setSignatures([])) }, [])
  return <label className="field-label"><span>{label}</span><select className="field-control" value={value || ''} onChange={(event) => onChange(event.target.value)}><option value="">Select configured doctor</option>{signatures.map((signature) => <option key={signature.id} value={signature.name}>{signature.name}{signature.role ? ` — ${signature.role}` : ''}</option>)}</select></label>
}

export function ConfiguredSignatureMark({ name, settings = {}, align = 'left' }) {
  const signature = (settings.signatures || []).find((entry) => entry.name === name) || (settings.signatures || []).find((entry) => entry.id === name)
  const displayName = signature?.name || name || 'Doctor signature'
  return <div className={align === 'right' ? 'text-right' : ''}>{signature?.path && <img src={signature.path} alt={`${displayName} signature`} className={`mb-2 h-12 max-w-32 object-contain ${align === 'right' ? 'ml-auto' : ''}`} />}<p className="font-medium">{displayName}</p><p className="text-xs text-slate-500">Doctor signature</p></div>
}
