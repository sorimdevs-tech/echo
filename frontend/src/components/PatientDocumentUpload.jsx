import { useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import { workspaceService } from '../api/workspaceService'

export default function PatientDocumentUpload({ customFields = {}, onChange }) {
  const [uploading, setUploading] = useState(false)
  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData(); body.append('file', file)
      const result = await workspaceService.uploadMedia(body)
      const document = result.data || {}
      onChange({ ...customFields, patient_document_name: document.filename || file.name, patient_document_path: document.url || document.path || '' })
    } finally { setUploading(false) }
  }
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><label className="field-label"><span>Patient document</span><span className="field-control flex cursor-pointer items-center gap-2 bg-white text-slate-600"><Upload className="h-4 w-4" /><span className="truncate">{uploading ? 'Uploading document…' : customFields.patient_document_name || 'Upload document'}</span><input type="file" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /></span></label>{customFields.patient_document_path && <a href={customFields.patient_document_path} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"><FileText className="h-4 w-4" />Open uploaded document</a>}</div>
}
